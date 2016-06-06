//
//  FBSocial.h
//
//  Created by Kuritsyna Marina on 17/06/15.
//  Copyright (c) 2015 R-Style. All rights reserved.
//

#import <Cordova/CDVPlugin.h>

@interface FBSocial : CDVPlugin

- (void) login:(CDVInvokedUrlCommand*)command;
- (void) logout:(CDVInvokedUrlCommand*)command;
- (void) getUserInfo:(CDVInvokedUrlCommand*)command;

@end