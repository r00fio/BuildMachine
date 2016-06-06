//
//  TouchID.h
//  TouchID
//
//  Created by Kuritsyna Marina on 05/06/15.
//  Copyright (c) 2015 Kuritsyna Marina. All rights reserved.
//

#import <Cordova/CDVPlugin.h>

@interface TouchID : CDVPlugin

- (void) savePrivateData:(CDVInvokedUrlCommand*)command;
- (void) checkTouchID:(CDVInvokedUrlCommand*)command;
- (void) checkSupportTouchID:(CDVInvokedUrlCommand*)command;

@end
