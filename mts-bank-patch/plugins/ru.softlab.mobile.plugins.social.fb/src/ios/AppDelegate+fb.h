//
//  AppDelegate+fb.h
//  TestFBSocial
//
//  Created by R-Style user on 03/09/15.
//
//

#import "AppDelegate.h"

@interface AppDelegate (fb)

- (void)applicationDidBecomeActive:(UIApplication *)application;
- (BOOL)application:(UIApplication *)application
            openURL:(NSURL *)url
  sourceApplication:(NSString *)sourceApplication
         annotation:(id)annotation;

@end
