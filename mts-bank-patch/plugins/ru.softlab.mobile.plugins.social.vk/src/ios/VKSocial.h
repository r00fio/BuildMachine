//
//  VKSocial.h
//
//  Created by Kuritsyna Marina on 10/06/15.
//  Copyright (c) 2015 R-Style. All rights reserved.
//

#import <Cordova/CDVPlugin.h>
#import <VKSdk/VKSdk.h>

@interface VKSocial : CDVPlugin <VKSdkDelegate>

- (void) login:(CDVInvokedUrlCommand*)command;
- (void) logout:(CDVInvokedUrlCommand*)command;
- (void) getUserInfo:(CDVInvokedUrlCommand*)command;

@end
