//
//  AppDelegate+fb.m
//  TestFBSocial
//
//  Created by R-Style user on 03/09/15.
//
//

#import "AppDelegate+fb.h"
#import <FBSDKCoreKit/FBSDKCoreKit.h>
#import <VKSdk/VKSdk.h>

@implementation AppDelegate (fb)

- (void)applicationDidBecomeActive:(UIApplication *)application {
    [FBSDKAppEvents activateApp];
}

//iOS9
- (BOOL)application:(UIApplication *)app openURL:(NSURL *)url options:(NSDictionary<NSString *,id> *)options {
    
    if ([url.scheme hasPrefix:[NSString stringWithFormat:@"fb%@", [[NSBundle mainBundle] objectForInfoDictionaryKey:@"FacebookAppID"]]]) {
        [[FBSDKApplicationDelegate sharedInstance] application:app
                                                       openURL:url
                                             sourceApplication:options[UIApplicationOpenURLOptionsSourceApplicationKey]
                                                    annotation:options];
    } else {
        [VKSdk processOpenURL:url fromApplication:options[UIApplicationOpenURLOptionsSourceApplicationKey]];
    }
    
    return YES;
}

//iOS8 and lower
- (BOOL)application:(UIApplication *)application
            openURL:(NSURL *)url
  sourceApplication:(NSString *)sourceApplication
         annotation:(id)annotation {
    
    if (!url) {
        return NO;
    }
    
    if ([url.scheme hasPrefix:[NSString stringWithFormat:@"fb%@", [[NSBundle mainBundle] objectForInfoDictionaryKey:@"FacebookAppID"]]]) {
        [[FBSDKApplicationDelegate sharedInstance] application:application
                                                       openURL:url
                                             sourceApplication:sourceApplication
                                                    annotation:annotation];
    } else {
        [VKSdk processOpenURL:url fromApplication:sourceApplication];
    }
    
    // all plugins will get the notification, and their handlers will be called
    [[NSNotificationCenter defaultCenter] postNotification:[NSNotification notificationWithName:CDVPluginHandleOpenURLNotification object:url]];
    
    return YES;
}

@end