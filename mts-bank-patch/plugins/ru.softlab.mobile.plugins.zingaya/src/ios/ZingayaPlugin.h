//
//  ZingayaPlugin.h
//
//  Created by Kuritsyna Marina on 29/07/15.
//  Copyright (c) 2015 R-Style. All rights reserved.
//

#import <Cordova/CDVPlugin.h>

#import "ZingayaSDKProtocol.h"

typedef enum
{
    Idle,
    Connecting,
    Calling,
    Speaking,
    Disconnecting
} AppState;

@interface ZingayaPlugin : CDVPlugin <ZingayaSDKProtocol>
{
    AppState currentState;
    NSString * callId;
}

@property (strong, nonatomic) CDVInvokedUrlCommand *currentCommand;

- (void) call:(CDVInvokedUrlCommand*)command;
- (void) hangup:(CDVInvokedUrlCommand*)command;
- (void) microphoneOn:(CDVInvokedUrlCommand*)command;
- (void) microphoneOff:(CDVInvokedUrlCommand*)command;

@end