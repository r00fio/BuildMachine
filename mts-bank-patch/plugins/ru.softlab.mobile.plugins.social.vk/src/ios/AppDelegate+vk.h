//
//  AppDelegate+vk.h
//  VKSocial
//
//  Created by R-Style user on 28/09/15.
//
//

#import "AppDelegate.h"
#import <VKSdk/VKSdk.h>

@interface AppDelegate (vk)

- (BOOL)application:(UIApplication *)application
            openURL:(NSURL *)url
  sourceApplication:(NSString *)sourceApplication
         annotation:(id)annotation;

@end