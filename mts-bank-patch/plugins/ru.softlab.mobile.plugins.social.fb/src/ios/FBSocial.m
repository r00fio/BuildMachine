//
//  FBSocial.m
//
//  Created by Kuritsyna Marina on 17/06/15.
//  Copyright (c) 2015 R-Style. All rights reserved.
//

#import "FBSocial.h"
#import <FBSDKCoreKit/FBSDKCoreKit.h>
#import <FBSDKLoginKit/FBSDKLoginKit.h>

#define IS_IOS7_above (floor(NSFoundationVersionNumber) > NSFoundationVersionNumber_iOS_6_1)

@interface FBSocial () {
    CDVInvokedUrlCommand *currentCommand;
    FBSDKLoginManager *loginManager;
    CDVPluginResult* pluginResult;
    NSMutableDictionary *data;
}
@end

@implementation FBSocial

- (void) login:(CDVInvokedUrlCommand*)command
{
    currentCommand = command;
    [self startLogin];
}

- (void) logout:(CDVInvokedUrlCommand*)command
{
    currentCommand = command;
    [loginManager logOut];
    [FBSDKAccessToken setCurrentAccessToken:nil];
    [FBSDKProfile setCurrentProfile:nil];
    
    pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:@"logout success"];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void) getUserInfo:(CDVInvokedUrlCommand*)command
{
    currentCommand = command;
    if ([FBSDKAccessToken currentAccessToken]) {
        [self startGetUserInfo];
    } else {
        [self startLogin];
    }
}

-(UIViewController*)findViewController
{
    id vc = self.webView;
    do {
        vc = [vc nextResponder];
    } while([vc isKindOfClass:UIView.class]);
    return vc;
}

- (void) startLogin
{
    loginManager = [[FBSDKLoginManager alloc] init];
    UIViewController *viewController = [self findViewController];
    
    if (![FBSDKAccessToken currentAccessToken]) {
        
        [loginManager logInWithReadPermissions:@[@"user_friends"] fromViewController:viewController handler:^(FBSDKLoginManagerLoginResult *result, NSError *error) {
            if (error) {
                NSLog(error.localizedDescription);
                pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:error.localizedDescription];
                [self.commandDelegate sendPluginResult:pluginResult callbackId:currentCommand.callbackId];
                
            } else if (result.isCancelled) {
                NSLog(error.localizedDescription);
                pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:error.localizedDescription];
                [self.commandDelegate sendPluginResult:pluginResult callbackId:currentCommand.callbackId];
                
            } else {
                if ([result.grantedPermissions containsObject:@"user_friends"]) {
                    [self startGetUserInfo];
                }
            }
        }];
    } else {
        NSLog(@"user already login");
        
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"user already login"];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:currentCommand.callbackId];
        
    }
}

- (void) startGetUserInfo
{
    data = [NSMutableDictionary new];
    
    if ([FBSDKAccessToken currentAccessToken]) {
        [self getMeRequest];
    } else {
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"need login"];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:currentCommand.callbackId];
        return;
    }
}

- (void) getMeRequest
{
    [[[FBSDKGraphRequest alloc] initWithGraphPath:@"/me?fields=id,first_name,last_name,picture" parameters:nil]
     startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection, id result, NSError *error) {
         if (!error) {
             NSDictionary *resultDict = [NSDictionary dictionaryWithDictionary:result];
             
             NSMutableDictionary *userInfo = [NSMutableDictionary new];
             userInfo[@"accessToken"] = [[FBSDKAccessToken currentAccessToken] tokenString];
             userInfo[@"id"] = [NSString stringWithFormat:@"%@", [resultDict objectForKey:@"id"]];
             userInfo[@"first_name"] = [resultDict objectForKey:@"first_name"];
             userInfo[@"last_name"] = [resultDict objectForKey:@"last_name"];
             NSString *photoUrl = [[[resultDict objectForKey:@"picture"] objectForKey:@"data"] objectForKey:@"url"];
             userInfo[@"pathPhoto"] = photoUrl;
             
             NSData *dataImage = [[NSData alloc] initWithContentsOfURL: [NSURL URLWithString:photoUrl]];
             NSString *photoBase64 = @"";
             if (dataImage) {
                 if (IS_IOS7_above) {
                     photoBase64 = [dataImage base64EncodedStringWithOptions:NSDataBase64Encoding64CharacterLineLength];
                 } else {
                     photoBase64 = [dataImage base64Encoding];
                 }
             }
             userInfo[@"photo"] = photoBase64;
             data[@"userInfo"] = userInfo;
             NSLog(@"userInfo : %@", data[@"userInfo"]);
             
             [self getFriendsRequest];
         } else {
             NSLog(@"error:%@", error.localizedDescription);
             
             pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:error.localizedDescription];
             [self.commandDelegate sendPluginResult:pluginResult callbackId:currentCommand.callbackId];
             return;
         }
     }];
}

- (void) getFriendsRequest
{
    [[[FBSDKGraphRequest alloc] initWithGraphPath:@"/me/friends?fields=id,first_name,last_name,picture" parameters:nil]
     startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection, id result, NSError *error) {
         if (!error) {
             
             NSDictionary *resultDict = [NSDictionary dictionaryWithDictionary:result];
             NSArray *items = [resultDict objectForKey:@"data"];
             NSMutableArray *friendsInfo = [NSMutableArray new];
             
             for (NSDictionary *item in items) {
                 NSMutableDictionary *dict = [NSMutableDictionary new];
                 dict[@"id"] = [NSString stringWithFormat:@"%@", [item objectForKey:@"id"]];
                 dict[@"first_name"] = [item objectForKey:@"first_name"];
                 dict[@"last_name"] = [item objectForKey:@"last_name"];
                 dict[@"photo"] = [[[item objectForKey:@"picture"] objectForKey:@"data"] objectForKey:@"url"];
                 
                 [friendsInfo addObject:dict];
             }
             data[@"friendsInfo"] = friendsInfo;
             NSLog(@"friendsInfo : %@", data[@"friendsInfo"]);
             
             pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:data];
             [self.commandDelegate sendPluginResult:pluginResult callbackId:currentCommand.callbackId];
             
         } else {
             NSLog(@"error:%@", error.localizedDescription);
             
             pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:error.localizedDescription];
             [self.commandDelegate sendPluginResult:pluginResult callbackId:currentCommand.callbackId];
             return;
         }
     }];
}

@end