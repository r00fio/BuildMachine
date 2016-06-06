//
//  ZingayaSDKiOS.h
//  zingaya_sdk
//
//  Created by Andrey Kovalenko on 26.05.11.
//  Copyright 2011 __MyCompanyName__. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "ZingayaTypes.h"
#import "ZingayaSDKProtocol.h"
@class iOSVideoEngine;

#import <UIKit/UIKit.h>



/*
 
    Main Zingaya SDK class.
    Must have only one instance.
 
 */

@interface ZingayaSDKiOS : NSObject {
    
    
    //ZingayaSDKiOS * instance;
    id<ZingayaSDKProtocol> handler; 
    iOSVideoEngine * videoEngine;
}

-(iOSVideoEngine *) getVideoEngine;

/***
 
 
 
 */
-(id<ZingayaSDKProtocol>)getDelegate;

/*
 
 Set current delegate object for SDK that will receive all events
 
 */
-(void)setDelegate: (id<ZingayaSDKProtocol>) delegate;

/*
 
 Returns single SDK object instance
 
 */

+(ZingayaSDKiOS *) getInstance;

/*
 
    Connects to specified host:port via specified protocol
    Currently only RTMP is supported
 
 */
-(void)connectVia:(NCProtocol) protocol toHost:(NSString *)host andPort:(int)port;

-(void)connectTo:(NSString *)host andPort:(int)port;


/* connect using load balancer*/

-(void)connectUsingBalancer:(NSString *)host;

/* connect to default Zingaya cloud */

-(void)connect;

/* connect to default Zingaya cloud with specific region id*/

-(void)connectToCloudWithRoute: (int) routeId only: (bool) strict;




/*
 
    Closes connection with ZMS
 
 */

-(void)closeConnection;

/*
 
 Returns call id for the newly created call. If not connected to server - returns nil
 
 */
-(NSString *)createCall: (NSString *) to withVideo: (bool) video;

/*

 Send start call request
 If call with specified id is not found - returns false;
 @param headers Optional SIP headerds
  */

-(bool)startCall: (NSString *) callId withHeaders: (NSDictionary *)headers;

/*
    
 Attach audio and video to specified call
 If call with specified id is not found - returns false;
 
 */

-(bool)attachAudioTo: (NSString *) callId;


/*
 
 Sends DTMF digit in specified call. Digit can be 0-9 for 0-9, 10 for * and 11 for #
 
 */

-(void)sendDTMF: (NSString *) callId digit: (int) digit;
/*
 
 Terminates specified call
 If call with specified id is not found - returns false;
 
 */


-(bool)disconnectCall: (NSString *) callId;

/*
 
 Performs ZMS authentication.
 Returns true if connected to server, otherwise returns false. 
 Authentication result is returned to delegate.
 
 */

-(bool)authenticate: (NSString *)login withPassword:(NSString *)pass;


/* 
	
	Adds From number replacement to current call

	Should be called BEFORE startCall

*/

-(void)setReplaceFrom: (NSString *)callId from: (NSString *)from;


/* 
	
	Adds to number replacement to current call. Should be called BEFORE startCall

*/

-(void)setReplaceTo: (NSString *)callId to: (NSString *)to replaceKey: (NSString *) replaceKey;

/* 
 
 Adds to number replacement to current call. Should be called BEFORE startCall
 
 */

-(void)setReplaceToWithHash: (NSString *)callId to: (NSString *)to hash: (NSString *) hash;
-(void)notifyVoicemailPromptFinished: (NSString *) callId;


-(void)startVideoCapture;
-(void)stopVideoCapture;
-(void)setLocalPreview: (UIView *)view;

-(void)setOutgoingVideoRotation: (ImageRotation ) rotation;
-(void)setOutgoingVideoPreviewRotation: (ImageRotation ) rotation;
-(bool)setUseLoudspeaker: (bool) b;
-(void)startPlayingDTMFDigit: (int) digit;
-(void)stopPlayingDTMFDigit;
-(NSTimeInterval)getCallDuration: (NSString *) callId;

-(void)setMute: (bool) b;

-(void) setReferrer: (NSString *) referrer;
-(void) setExtraConnectionInfo: (NSString *) extraInfo;

@end 
