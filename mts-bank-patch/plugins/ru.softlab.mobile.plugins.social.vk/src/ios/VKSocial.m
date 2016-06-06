//
//  VKSocial.m
//
//  Created by Kuritsyna Marina on 10/06/15.
//  Copyright (c) 2015 R-Style. All rights reserved.
//

#import "VKSocial.h"

#define IS_IOS7_above (floor(NSFoundationVersionNumber) > NSFoundationVersionNumber_iOS_6_1)

static NSString *const KEY_APP_ID = @"VKontakteAppID";
static NSArray *SCOPE = nil;

@implementation VKSocial {
    CDVInvokedUrlCommand *savedCommand;
    __block CDVPluginResult* pluginResult;
}

- (void) login:(CDVInvokedUrlCommand*)command
{
    savedCommand = command;
    
    SCOPE = @[VK_PER_FRIENDS];
    NSString *APP_ID = [[NSBundle mainBundle] objectForInfoDictionaryKey:KEY_APP_ID];
    [VKSdk initializeWithDelegate:self andAppId:APP_ID];
    
    if ([VKSdk wakeUpSession]) {
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:@"user already login!"];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    } else {
        [self authorize];
    }
}

- (void) logout:(CDVInvokedUrlCommand*)command
{
    savedCommand = command;
    [VKSdk forceLogout];
    
    pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:@"logout was success"];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (void) getUserInfo:(CDVInvokedUrlCommand*)command
{
    savedCommand = command;
    
    SCOPE = @[VK_PER_FRIENDS];
    NSString *APP_ID = [[NSBundle mainBundle] objectForInfoDictionaryKey:KEY_APP_ID];
    [VKSdk initializeWithDelegate:self andAppId:APP_ID];
    
    if ([VKSdk wakeUpSession]) {
        [self startWorking:[VKSdk getAccessToken]];
    } else {
        [self authorize];
    }
}

- (void)startWorking:(VKAccessToken *)accessToken {
    
    NSLog(@"Start request to VK..");
    
    // пакет запросов - get userInfo and frendsInfo
    VKRequest *reqUser = [VKRequest requestWithMethod:@"users.get" andParameters:@{@"fields": @"id, first_name, last_name, nickname, photo_medium"} andHttpMethod:@"GET"];
    VKRequest *reqFriends = [VKRequest requestWithMethod:@"friends.get" andParameters:@{@"fields": @"id, first_name, last_name, nickname, photo_medium"} andHttpMethod:@"GET"];
    VKBatchRequest *batch = [[VKBatchRequest alloc] initWithRequests: reqUser, reqFriends, nil];
    
    [batch executeWithResultBlock:^(NSArray *responses) {
        NSLog(@"Responses %@", responses);
        
        NSMutableDictionary *loginDetails = [NSMutableDictionary new];
        
        if ([responses count] == 2) {
            VKResponse *respUser = [responses objectAtIndex:0];
            NSLog(@"User response %@", respUser);
            if ([respUser.json isKindOfClass:NSArray.class]) {
                
                NSMutableDictionary *userInfo = [NSMutableDictionary new];
                
                userInfo[@"accessToken"] = accessToken.accessToken;
                userInfo[@"id"] = [NSString stringWithFormat:@"%@", [[respUser.json objectAtIndex:0] objectForKey:@"id"]];
                userInfo[@"first_name"] = [[respUser.json objectAtIndex:0] objectForKey:@"first_name"];
                userInfo[@"last_name"] = [[respUser.json objectAtIndex:0] objectForKey:@"last_name"];
                NSString *photoUrl = [[respUser.json objectAtIndex:0] objectForKey:@"photo_medium"];
                userInfo[@"pathPhoto"] = photoUrl;
                
                NSData *data = [[NSData alloc] initWithContentsOfURL: [NSURL URLWithString:photoUrl]];
                NSString *photoBase64 = @"";
                if (data) {
                    if (IS_IOS7_above) {
                        photoBase64 = [data base64EncodedStringWithOptions:NSDataBase64Encoding64CharacterLineLength];
                    } else {
                        photoBase64 = [data base64Encoding];
                    }
                }
                userInfo[@"photo"] = photoBase64;
                
                loginDetails[@"userInfo"] = userInfo;
            }
            
            VKResponse *respFriends = [responses objectAtIndex:1];
            NSLog(@"Friends response %@", respFriends);
            
            NSMutableArray *friendsInfo = [NSMutableArray new];
            
            NSArray *items = [respFriends.json objectForKey:@"items"];
            for (NSDictionary *item in items) {
                NSMutableDictionary *data = [NSMutableDictionary new];
                data[@"id"] = [NSString stringWithFormat:@"%@", [item objectForKey:@"id"]];
                data[@"first_name"] = [item objectForKey:@"first_name"];
                data[@"last_name"] = [item objectForKey:@"last_name"];
                data[@"photo"] = [item objectForKey:@"photo_medium"];
                
                [friendsInfo addObject:data];
            }
            loginDetails[@"friendsInfo"] = friendsInfo;
        }
        
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:loginDetails];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:savedCommand.callbackId];
    } errorBlock:^(NSError *error) {
        NSLog(@"Cant load user details");
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:savedCommand.callbackId];
    }];
    
}

- (void)authorize {
    
    NSLog(@"Process authorization...");
    
    [VKSdk authorize:SCOPE revokeAccess:YES ];
}

-(UIViewController*)findViewController
{
    id vc = self.webView;
    do {
        vc = [vc nextResponder];
    } while([vc isKindOfClass:UIView.class]);
    return vc;
}

//
// VKSdkDelegate
//
- (void)vkSdkNeedCaptchaEnter:(VKError *)captchaError {
    
    NSLog(@"event vkSdkNeedCaptchaEnter");
    
    VKCaptchaViewController *vc = [VKCaptchaViewController captchaControllerWithError:captchaError];
    [vc presentIn:[self findViewController]];
}

- (void)vkSdkTokenHasExpired:(VKAccessToken *)expiredToken {
    
    NSLog(@"event vkSdkTokenHasExpired");
    
    [self authorize];
}

- (void)vkSdkReceivedNewToken:(VKAccessToken *)newToken {
    
    NSLog(@"event vkSdkReceivedNewToken");
    
    [self startWorking:newToken];
}

- (void)vkSdkShouldPresentViewController:(UIViewController *)controller {
    
    NSLog(@"event vkSdkShouldPresentViewController");
    
    [[self findViewController] presentViewController:controller animated:YES completion:nil];
}

- (void)vkSdkAcceptedUserToken:(VKAccessToken *)token {
    
    NSLog(@"event vkSdkAcceptedUserToken");
    
    [self startWorking:token];
}

- (void)vkSdkUserDeniedAccess:(VKError *)authorizationError {
    
    NSLog(@"event vkSdkUserDeniedAccess");
    
    pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"Access denied"];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:savedCommand.callbackId];
}

@end
