/*
 Licensed to the Apache Software Foundation (ASF) under one
 or more contributor license agreements.  See the NOTICE file
 distributed with this work for additional information
 regarding copyright ownership.  The ASF licenses this file
 to you under the Apache License, Version 2.0 (the
 "License"); you may not use this file except in compliance
 with the License.  You may obtain a copy of the License at
 
 http://www.apache.org/licenses/LICENSE-2.0
 
 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an
 "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 KIND, either express or implied.  See the License for the
 specific language governing permissions and limitations
 under the License.
 */

#import "CDVKeyboard.h"
#import <Cordova/CDVAvailability.h>
#import <objc/runtime.h>

#ifndef __CORDOVA_3_2_0
#warning "The keyboard plugin is only supported in Cordova 3.2 or greater, it may not work properly in an older version. If you do use this plugin in an older version, make sure the HideKeyboardFormAccessoryBar and KeyboardShrinksView preference values are false."
#endif

@interface CDVKeyboard () <UIScrollViewDelegate>
{
    UIColor *backgroundColor;
}
@property (nonatomic, readwrite, assign) BOOL keyboardIsVisible;
@property (nonatomic, readwrite, assign) BOOL isKeyboardWithButton;

@end

@implementation CDVKeyboard

- (id)settingForKey:(NSString*)key
{
    return [self.commandDelegate.settings objectForKey:[key lowercaseString]];
}

#pragma mark Initialize

- (void)pluginInitialize
{
    NSString* setting = nil;
    
    setting = @"HideKeyboardFormAccessoryBar";
    if ([self settingForKey:setting]) {
        self.hideFormAccessoryBar = [(NSNumber*)[self settingForKey:setting] boolValue];
    }
    
    setting = @"KeyboardShrinksView";
    if ([self settingForKey:setting]) {
        self.shrinkView = [(NSNumber*)[self settingForKey:setting] boolValue];
    }
    
    setting = @"DisableScrollingWhenKeyboardShrinksView";
    if ([self settingForKey:setting]) {
        self.disableScrollingInShrinkView = [(NSNumber*)[self settingForKey:setting] boolValue];
    }
    
    NSNotificationCenter* nc = [NSNotificationCenter defaultCenter];
    __weak CDVKeyboard* weakSelf = self;
    
    _keyboardShowObserver = [nc addObserverForName:UIKeyboardDidShowNotification
                                            object:nil
                                             queue:[NSOperationQueue mainQueue]
                                        usingBlock:^(NSNotification* notification) {
                                            [weakSelf.commandDelegate evalJs:@"Keyboard.fireOnShow();"];
                                        }];
    _keyboardHideObserver = [nc addObserverForName:UIKeyboardDidHideNotification
                                            object:nil
                                             queue:[NSOperationQueue mainQueue]
                                        usingBlock:^(NSNotification* notification) {
                                            [weakSelf.commandDelegate evalJs:@"Keyboard.fireOnHide();"];
                                        }];
    _keyboardWillShowObserver = [nc addObserverForName:UIKeyboardWillShowNotification
                                                object:nil
                                                 queue:[NSOperationQueue mainQueue]
                                            usingBlock:^(NSNotification* notification) {
                                                [weakSelf.commandDelegate evalJs:@"Keyboard.fireOnShowing();"];
                                                weakSelf.keyboardIsVisible = YES;
                                            }];
    _keyboardWillHideObserver = [nc addObserverForName:UIKeyboardWillHideNotification
                                                object:nil
                                                 queue:[NSOperationQueue mainQueue]
                                            usingBlock:^(NSNotification* notification) {
                                                [weakSelf.commandDelegate evalJs:@"Keyboard.fireOnHiding();"];
                                                weakSelf.keyboardIsVisible = NO;
                                                weakSelf.isKeyboardWithButton = NO;
                                            }];
    
    _shrinkViewKeyboardWillChangeFrameObserver = [nc addObserverForName:UIKeyboardWillChangeFrameNotification
                                                                 object:nil
                                                                  queue:[NSOperationQueue mainQueue]
                                                             usingBlock:^(NSNotification* notification) {
                                                                 [weakSelf performSelector:@selector(shrinkViewKeyboardWillChangeFrame:) withObject:notification afterDelay:0];
                                                                 CGRect screen = [[UIScreen mainScreen] bounds];
                                                                 CGRect keyboard = ((NSValue*)notification.userInfo[@"UIKeyboardFrameEndUserInfoKey"]).CGRectValue;
                                                                 CGRect intersection = CGRectIntersection(screen, keyboard);
                                                                 CGFloat height = MIN(intersection.size.width, intersection.size.height);
                                                                 [weakSelf.commandDelegate evalJs: [NSString stringWithFormat:@"cordova.fireWindowEvent('keyboardHeightWillChange', { 'keyboardHeight': %f })", height]];
                                                             }];
    
    self.webView.scrollView.delegate = self;
    self.isKeyboardWithButton = NO;
    backgroundColor = [UIColor colorWithRed:36.0/255.0f green:167.0/255.0f blue:179.0/255.0f alpha:1.0];
}

#pragma mark HideFormAccessoryBar

- (BOOL)hideFormAccessoryBar
{
    return _hideFormAccessoryBar;
}

static IMP UIOriginalImp;
static IMP WKOriginalImp;

- (void)setHideFormAccessoryBar:(BOOL)ahideFormAccessoryBar
{
    if (ahideFormAccessoryBar == _hideFormAccessoryBar) {
        return;
    }
    
    Method UIMethod = class_getInstanceMethod(NSClassFromString(@"UIWebBrowserView"), @selector(inputAccessoryView));
    Method WKMethod = class_getInstanceMethod(NSClassFromString(@"WKContentView"), @selector(inputAccessoryView));
    
    if (ahideFormAccessoryBar) {
        UIOriginalImp = method_getImplementation(UIMethod);
        WKOriginalImp = method_getImplementation(WKMethod);
        
        IMP newImp = imp_implementationWithBlock(^(id _s) {
            return nil;
        });
        
        method_setImplementation(UIMethod, newImp);
        method_setImplementation(WKMethod, newImp);
    } else {
        method_setImplementation(UIMethod, UIOriginalImp);
        method_setImplementation(WKMethod, WKOriginalImp);
    }
    
    _hideFormAccessoryBar = ahideFormAccessoryBar;
}

#pragma mark KeyboardShrinksView

- (void)shrinkViewKeyboardWillChangeFrame:(NSNotification*)notif
{
    // No-op on iOS 7.0.  It already resizes webview by default, and this plugin is causing layout issues
    // with fixed position elements.  We possibly should attempt to implement shrinkview = false on iOS7.0.
    // iOS 7.1+ behave the same way as iOS 6
    if (NSFoundationVersionNumber < NSFoundationVersionNumber_iOS_7_1 && NSFoundationVersionNumber > NSFoundationVersionNumber_iOS_6_1) {
        return;
    }
    
    // If the view is not visible, we should do nothing. E.g. if the inappbrowser is open.
    if (!(self.viewController.isViewLoaded && self.viewController.view.window)) {
        return;
    }
    
    self.webView.scrollView.scrollEnabled = YES;
    
    CGRect screen = [[UIScreen mainScreen] bounds];
    CGRect statusBar = [[UIApplication sharedApplication] statusBarFrame];
    CGRect keyboard = ((NSValue*)notif.userInfo[@"UIKeyboardFrameEndUserInfoKey"]).CGRectValue;
    
    // Work within the webview's coordinate system
    keyboard = [self.webView convertRect:keyboard fromView:nil];
    statusBar = [self.webView convertRect:statusBar fromView:nil];
    screen = [self.webView convertRect:screen fromView:nil];
    
    // if the webview is below the status bar, offset and shrink its frame
    if ([self settingForKey:@"StatusBarOverlaysWebView"] != nil && ![[self settingForKey:@"StatusBarOverlaysWebView"] boolValue]) {
        CGRect full, remainder;
        CGRectDivide(screen, &remainder, &full, statusBar.size.height, CGRectMinYEdge);
        screen = full;
    }
    
    // Get the intersection of the keyboard and screen and move the webview above it
    // Note: we check for _shrinkView at this point instead of the beginning of the method to handle
    // the case where the user disabled shrinkView while the keyboard is showing.
    // The webview should always be able to return to full size
    CGRect keyboardIntersection = CGRectIntersection(screen, keyboard);
    if (CGRectContainsRect(screen, keyboardIntersection) && !CGRectIsEmpty(keyboardIntersection) && _shrinkView && self.keyboardIsVisible) {
        screen.size.height -= keyboardIntersection.size.height;
        self.webView.scrollView.scrollEnabled = !self.disableScrollingInShrinkView;
    }
    
    // A view's frame is in its superview's coordinate system so we need to convert again
    self.webView.frame = [self.webView.superview convertRect:screen fromView:self.webView];
    
    [self redrawKeyboardView];
}

/* redraw keyboard view*/
- (void)redrawKeyboardView
{
    if (self.keyboardIsVisible) {
        for (UIWindow *keyboardWindow in [[UIApplication sharedApplication] windows]) {
            for (UIView *keyboard in [keyboardWindow subviews]) {
                for (UIView *toolbar in [self subviewsOfView:keyboard withType:@"UIToolbar"]) {
                    UIView *newView = [[UIView alloc] initWithFrame:[toolbar frame]];
                    newView.frame = CGRectMake(newView.frame.origin.x, newView.frame.origin.y, newView.frame.size.width, newView.frame.size.height);
                    [newView setBackgroundColor:backgroundColor];
                    
                    // add Done button
                    for (UIView *toolbarTxtBtn in [self subviewsOfView:toolbar withType:@"UIToolbarTextButton"]) {
                        UIButton *txtBtn = [[UIButton alloc] initWithFrame:[toolbarTxtBtn frame]];
                        txtBtn.frame = CGRectMake(txtBtn.frame.origin.x - 20, txtBtn.frame.origin.y, txtBtn.frame.size.width + 20, txtBtn.frame.size.height);
                        [txtBtn setBackgroundColor:[UIColor clearColor]];
                        [txtBtn setTintColor:[UIColor whiteColor]];
                        txtBtn.titleLabel.font = [UIFont systemFontOfSize:16];
                        [txtBtn setTitle:@"Готово" forState:UIControlStateNormal];
                        
                        [txtBtn addTarget:self action:@selector(pressedDone) forControlEvents:UIControlEventTouchUpInside];
                        [newView addSubview:txtBtn];
                    }
                    
                    if (self.isKeyboardWithButton) {
                        
                        // add buttons CONTACT_LIST and PERSONAL_ACC
                        UIImage *img1 = [UIImage imageNamed:@"contacts.png"];
                        UIButton *newBtn1 = [[UIButton alloc] initWithFrame:CGRectMake(25.0f, newView.frame.size.height/2 - img1.size.height/4,
                                                                                       img1.size.width/2, img1.size.height/2)];
                        [newBtn1 setImage:img1 forState:(UIControlStateNormal)];
                        [newBtn1 addTarget:self action:@selector(pressedContactListBtn) forControlEvents:UIControlEventTouchUpInside];
                        [newView addSubview:newBtn1];
                        
                        UIImage *img2 = [UIImage imageNamed:@"person.png"];
                        UIButton *newBtn2 = [[UIButton alloc] initWithFrame:CGRectMake(newBtn1.frame.size.width + 45.0f, newView.frame.size.height/2 - img2.size.height/4,
                                                                                       img2.size.width/2, img2.size.height/2)];
                        [newBtn2 setImage:img2 forState:UIControlStateNormal];
                        [newBtn2 addTarget:self action:@selector(pressedPersonalAccBtn) forControlEvents:UIControlEventTouchUpInside];
                        [newView addSubview:newBtn2];
                    }
                    
                    [toolbar insertSubview:newView belowSubview:toolbar];
                }
            }
        }
    }
}

-(NSArray*)subviewsOfView:(UIView*)view withType:(NSString*)type{
    NSString *prefix = [NSString stringWithFormat:@"<%@",type];
    NSMutableArray *subviewArray = [NSMutableArray array];
    for (UIView *subview in view.subviews) {
        NSArray *tempArray = [self subviewsOfView:subview withType:type];
        for (UIView *view in tempArray) {
            [subviewArray addObject:view];
        }
    }
    if ([[view description]hasPrefix:prefix]) {
        [subviewArray addObject:view];
    }
    return [NSArray arrayWithArray:subviewArray];
}

#pragma mark UIScrollViewDelegate

- (void)scrollViewDidScroll:(UIScrollView*)scrollView
{
    if (_shrinkView) {
        scrollView.bounds = self.webView.bounds;
    }
}

#pragma mark Plugin interface

- (void)shrinkView:(CDVInvokedUrlCommand*)command
{
    id value = [command.arguments objectAtIndex:0];
    if (!([value isKindOfClass:[NSNumber class]])) {
        value = [NSNumber numberWithBool:NO];
    }
    
    self.shrinkView = [value boolValue];
}

- (void)disableScrollingInShrinkView:(CDVInvokedUrlCommand*)command
{
    id value = [command.arguments objectAtIndex:0];
    if (!([value isKindOfClass:[NSNumber class]])) {
        value = [NSNumber numberWithBool:NO];
    }
    
    self.disableScrollingInShrinkView = [value boolValue];
}

- (void)hideFormAccessoryBar:(CDVInvokedUrlCommand*)command
{
    id value = [command.arguments objectAtIndex:0];
    if (!([value isKindOfClass:[NSNumber class]])) {
        value = [NSNumber numberWithBool:NO];
    }
    
    self.hideFormAccessoryBar = [value boolValue];
}

- (void)hide:(CDVInvokedUrlCommand*)command
{
    [self.webView endEditing:YES];
}

- (void)showWithButtons:(CDVInvokedUrlCommand*)command
{
    self.isKeyboardWithButton = YES;
}

#pragma mark UIButtons handler

- (void)pressedDone
{
    [self.webView endEditing:YES];
}

- (void)pressedPersonalAccBtn
{
    [self.webView endEditing:YES];
    [self.commandDelegate evalJs:@"Keyboard.fireOnClickPersonalAcc();"];
}

- (void)pressedContactListBtn
{
    [self.webView endEditing:YES];
    [self.commandDelegate evalJs:@"Keyboard.fireOnClickContactList();"];
}

#pragma mark dealloc

- (void)dealloc
{
    // since this is ARC, remove observers only
    
    NSNotificationCenter* nc = [NSNotificationCenter defaultCenter];
    
    [nc removeObserver:self name:UIKeyboardWillShowNotification object:nil];
    [nc removeObserver:self name:UIKeyboardWillHideNotification object:nil];
    [nc removeObserver:self name:UIKeyboardWillChangeFrameNotification object:nil];
}

@end
