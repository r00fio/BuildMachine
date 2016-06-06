//
//  ZingayaSDKProtocol.h
//  zingaya_sdk
//
//  Created by Andrey Kovalenko on 26.05.11.
//  Copyright 2011 __MyCompanyName__. All rights reserved.
//

#import <Foundation/Foundation.h>

@class CallFailedEvent;

@protocol ZingayaSDKProtocol

- (void) onConnectionSuccessful;
- (void) onConnectionClosed;
- (void) onConnectionFailed: (NSString *) reason;

- (void) onVoicemail: (NSString *) callId;
- (void) onCallConnected: (NSString *) callId;
- (void) onCallDisconnected: (NSString *) callId;
- (void) onCallRinging: (NSString *) callId;
- (void) onCallFailed: (NSString *) callId withCode: (int) code andReason: (NSString*) reason;
- (void) onCallStartAudio: (NSString *) callId;

- (void) onAuthOk: (NSString *) displayName;
- (void) onAuthFailed;

- (void) drawIncomingVideo: (const unsigned char *) data: (int) width: (int) height: (int) linesize;
- (void) onAudioInterruptionBegan;
- (void) onAudioInterruptionEnded;
@end
