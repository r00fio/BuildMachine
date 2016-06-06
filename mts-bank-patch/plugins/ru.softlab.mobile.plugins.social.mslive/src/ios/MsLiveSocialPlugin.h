//
//  MsLiveSocialPlugin.h
//
//  Created by Kuritsyna Marina on 30/06/15.
//  Copyright (c) 2015 R-Style. All rights reserved.
//

#import <Cordova/CDVPlugin.h>
#import <LiveSDK/LiveConnectClient.h>

@interface MsLiveSocialPlugin : CDVPlugin <LiveAuthDelegate, LiveOperationDelegate, LiveDownloadOperationDelegate, LiveUploadOperationDelegate>

@property (strong, nonatomic) LiveConnectClient *liveClient;
@property (strong, nonatomic) CDVInvokedUrlCommand *currentCommand;

- (void) login:(CDVInvokedUrlCommand*)command;
- (void) logout:(CDVInvokedUrlCommand*)command;
- (void) getUserInfo:(CDVInvokedUrlCommand*)command;

@end