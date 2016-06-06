//
//  MsLiveSocialPlugin.m
//
//  Created by Kuritsyna Marina on 30/06/15.
//  Copyright (c) 2015 R-Style. All rights reserved.
//

#import "MsLiveSocialPlugin.h"

#define IS_IOS7_above (floor(NSFoundationVersionNumber) > NSFoundationVersionNumber_iOS_6_1)

@interface MsLiveSocialPlugin () {
    __block CDVPluginResult* pluginResult;
    NSMutableDictionary *loginDetails;
}
@end

@implementation MsLiveSocialPlugin

@synthesize liveClient;
NSString* KEY_APP_ID = @"MicrosoftLiveAppID";

- (void) login:(CDVInvokedUrlCommand*)command
{
    self.currentCommand = command;
    if (self.liveClient.session) {
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:@"user already login"];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        return;
    }
    [self startLogin];
}

- (void) logout:(CDVInvokedUrlCommand*)command
{
    self.currentCommand = command;
    [self.liveClient logout];
    pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:@"logout success!"];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void) getUserInfo:(CDVInvokedUrlCommand*)command
{
    self.currentCommand = command;
    loginDetails = [NSMutableDictionary new];
    if (self.liveClient.session) {
        [self getMeInfo];
    } else {
        [self startLogin];
    }
}


/*
 *---------------
 * Local methods
 *---------------
 */

-(UIViewController *)findViewController
{
    id vc = self.webView;
    do {
        vc = [vc nextResponder];
    } while([vc isKindOfClass:UIView.class]);
    return vc;
}

- (void)startLogin {
    NSString *APP_ID = [[NSBundle mainBundle] objectForInfoDictionaryKey:KEY_APP_ID];
    self.liveClient = [[LiveConnectClient alloc] initWithClientId:APP_ID
                                                         delegate:self
                                                        userState:@"initialize"];
}

- (void)authCompleted:(LiveConnectSessionStatus) status
              session:(LiveConnectSession *) session
            userState:(id) userState
{
    if ([userState isEqual:@"initialize"])
    {
        NSLog(@"Initialized.");
        [self.liveClient login:[self findViewController]
                        scopes:[NSArray arrayWithObjects:@"wl.signin", nil]
                      delegate:self
                     userState:@"signin"];
    }
    if ([userState isEqual:@"signin"])
    {
        if (session != nil)
        {
            NSLog(@"Signed in.");
            if ([self.currentCommand.methodName isEqualToString:@"login"]) {
                pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:@"login success"];
                [self.commandDelegate sendPluginResult:pluginResult callbackId:self.currentCommand.callbackId];
            }
            if ([self.currentCommand.methodName isEqualToString:@"getUserInfo"]) {
                [self getMeInfo];
            }
        }
    }
}

- (void)authFailed:(NSError *) error
         userState:(id)userState
{
    NSString *err = [NSString stringWithFormat:@"Auth failed with error: %@", [error localizedDescription]];
    NSLog(err);
    pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:err];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:self.currentCommand.callbackId];
}

- (void)getMeInfo
{
    if (self.liveClient) {
        [self.liveClient getWithPath:@"me"
                            delegate:self
                           userState:@"me"];
    }
}

- (void)getMyProfilePicture
{
    if (self.liveClient) {
        [self.liveClient getWithPath:@"me/picture"
                            delegate:self
                           userState:@"me-picture"];
    }
}

- (void)getFriendsList
{
    if (self.liveClient) {
        [self.liveClient getWithPath:@"me/friends"
                            delegate:self
                           userState:@"me-friends"];
    }
}


- (void)liveOperationSucceeded:(LiveOperation *)operation
{
    if ([operation.userState isEqual:@"me"]) {
        
        NSMutableDictionary *userInfo = [NSMutableDictionary new];
        userInfo[@"id"] = [operation.result objectForKey:@"id"];
        userInfo[@"first_name"] = [operation.result objectForKey:@"first_name"];
        userInfo[@"last_name"] = [operation.result objectForKey:@"last_name"];
        userInfo[@"photo"] = @"";
        
        loginDetails[@"userInfo"] = userInfo;
        [self getMyProfilePicture];
    }
    if ([operation.userState isEqual:@"me-picture"]) {
        NSString *location = [operation.result objectForKey:@"location"];
        if (location) {
            
            NSData *data = [[NSData alloc] initWithContentsOfURL: [NSURL URLWithString:location]];
            NSString *photoBase64 = @"";
            if (data) {
                if (IS_IOS7_above) {
                    photoBase64 = [data base64EncodedStringWithOptions:NSDataBase64Encoding64CharacterLineLength];
                } else {
                    photoBase64 = [data base64Encoding];
                }
            }
            
            NSDictionary *obj = [loginDetails objectForKey:@"userInfo"];
            [obj setValue:photoBase64 forKey:@"photo"];
            loginDetails[@"userInfo"] = obj;
        }
        [self getFriendsList];
    }
    if ([operation.userState isEqual:@"me-friends"]) {
        
        NSArray *dataArray = [operation.result objectForKey:@"data"];
        NSMutableArray *friendsInfo = [NSMutableArray new];
        if (dataArray && dataArray.count > 0) {
            for (NSDictionary *d in dataArray) {
                NSMutableDictionary *item = [NSMutableDictionary new];
                [item setObject:[d objectForKey:@"id"] forKey:@"id"];
                [item setObject:[d objectForKey:@"first_name"] forKey:@"first_name"];
                [item setObject:[d objectForKey:@"last_name"] forKey:@"last_name"];
                [friendsInfo addObject:item];
            }
        }
        loginDetails[@"friendsInfo"] = friendsInfo;
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:loginDetails];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:self.currentCommand.callbackId];
    }
}

- (void)liveOperationFailed:(NSError *)error operation:(LiveOperation *)operation
{
    NSString *err = [NSString stringWithFormat:@"LiveOperation failed with error: %@", [error localizedDescription]];
    NSLog(err);
    pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:err];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:self.currentCommand.callbackId];
}

@end