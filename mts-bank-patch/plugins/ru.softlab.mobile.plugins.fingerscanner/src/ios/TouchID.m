//
//  TouchID.m
//  TouchID
//
//  Created by Kuritsyna Marina on 05/06/15.
//  Copyright (c) 2015 Kuritsyna Marina. All rights reserved.
//

#import "TouchID.h"
#import <LocalAuthentication/LocalAuthentication.h>

@implementation TouchID

NSString * const serviceIdentifie = @"SecureStore";
NSString * const accountName = @"AccountName";
NSString * const titleDialog = @"Для входа приложите палец";

- (void) savePrivateData:(CDVInvokedUrlCommand*)command
{
    if ([self isSupportTouchID:command]) {
        [self tryAuthentication:command];
    }
}

- (void) checkTouchID:(CDVInvokedUrlCommand*)command
{
    if ([self isSupportTouchID:command]) {
        [self copyMatching:command];
    }
}

- (void) checkSupportTouchID:(CDVInvokedUrlCommand*)command
{
    BOOL flag = [self isSupportTouchID:command];
    __block CDVPluginResult* pluginResult = nil;
    pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsBool:flag];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

- (BOOL)isSupportTouchID:(CDVInvokedUrlCommand *)command
{
    if (NSClassFromString(@"LAContext") != nil)
    {
        LAContext *laContext = [[LAContext alloc] init];
        NSError *authError = nil;
        
        if ([laContext canEvaluatePolicy:LAPolicyDeviceOwnerAuthenticationWithBiometrics error:&authError])
        {
            return true;
        }
        NSString *errMsg = [NSString stringWithFormat:@" %@",[authError localizedDescription]];
        
        if (![command.methodName isEqualToString:@"checkSupportTouchID"]) {
            __block CDVPluginResult* pluginResult = nil;
            
            switch (authError.code) {
                case LAErrorUserCancel:
                    errMsg = @"LAErrorUserCancel";
                    break;
                case LAErrorUserFallback:
                    errMsg = @"LAErrorUserFallback";
                    break;
                case LAErrorSystemCancel:
                    errMsg = @"LAErrorSystemCancel";
                    break;
                case LAErrorPasscodeNotSet:
                    errMsg = @"LAErrorPasscodeNotSet";
                    break;
                case LAErrorTouchIDNotAvailable:
                    errMsg = @"LAErrorTouchIDNotAvailable";
                    break;
                case LAErrorTouchIDNotEnrolled:
                    errMsg = @"LAErrorTouchIDNotEnrolled";
                    break;
                case LAErrorAuthenticationFailed:
                default:
                    errMsg = @"LAErrorAuthenticationFailed";
                    break;
            }
            
            pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:errMsg];
            [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        }
        NSLog(errMsg);
    }
    return false;
}

- (void)tryAuthentication:(CDVInvokedUrlCommand *)command
{
    LAContext *laContext = [[LAContext alloc] init];
    __block CDVPluginResult* pluginResult = nil;
    
    laContext.localizedFallbackTitle = @"";
    [laContext evaluatePolicy:LAPolicyDeviceOwnerAuthenticationWithBiometrics
              localizedReason:titleDialog
                        reply:^(BOOL success, NSError *error) {
                            if (error) {
                                NSString *errMsg = [NSString stringWithFormat:@" %@",[error localizedDescription]];
                                pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:errMsg];
                                [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
                                return;
                            }
                            if (success) {
                                NSDictionary *argsDictionary = [command.arguments objectAtIndex:0];
                                NSData *jsonData = [NSJSONSerialization dataWithJSONObject:argsDictionary options:0 error:nil];
                                NSString *jsonStr = [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];
                                [self addItem:jsonStr cdvCommand:command];
                            } else {
                                pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR];
                                [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
                                return;
                            }
                        }];
}

// add item to store
- (void)addItem:(NSString *)data cdvCommand:(CDVInvokedUrlCommand *)command
{
    __block CDVPluginResult* pluginResult = nil;
    
    CFErrorRef error = NULL;
    SecAccessControlRef sacObject;
    
    // Delete item if need
    [self deleteItem];
    
    // Create the appropriate access controls
    sacObject = SecAccessControlCreateWithFlags(kCFAllocatorDefault,
                                                kSecAttrAccessibleWhenPasscodeSetThisDeviceOnly,
                                                kSecAccessControlUserPresence, &error);
    if(sacObject == NULL || error != NULL)
    {
        NSLog(@"can't create sacObject: %@", error);
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:[NSString stringWithFormat:@"%@", error]];
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        return;
    }
    NSDictionary *attributes = @{
                                 (__bridge id)kSecClass: (__bridge id)kSecClassGenericPassword,
                                 (__bridge id)kSecAttrService: serviceIdentifie,
                                 (__bridge id)kSecAttrAccount: accountName,
                                 (__bridge id)kSecValueData: [data dataUsingEncoding:NSUTF8StringEncoding],
                                 (__bridge id)kSecUseAuthenticationUI: @YES,
                                 (__bridge id)kSecAttrAccessControl: (__bridge_transfer id)sacObject
                                 };
    
    OSStatus status =  SecItemAdd((__bridge CFDictionaryRef)attributes, nil);
    NSString *errorMsg = [self keychainErrorToString:status];
    NSLog(@"SEC_ITEM_ADD_STATUS: %@", errorMsg);
    
    pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsString:errorMsg];
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
}

// get secret from store
- (void)copyMatching:(CDVInvokedUrlCommand *)command
{
    __block CDVPluginResult* pluginResult = nil;
    
    NSDictionary *query = @{
                            (__bridge id)kSecClass: (__bridge id)kSecClassGenericPassword,
                            (__bridge id)kSecAttrService: serviceIdentifie,
                            (__bridge id)kSecAttrAccount: accountName,
                            (__bridge id)kSecReturnData: @YES,
                            (__bridge id)kSecUseOperationPrompt: NSLocalizedString(titleDialog, nil)
                            };
    
    CFTypeRef dataTypeRef = NULL;
    NSString *msg;
    
    OSStatus status = SecItemCopyMatching((__bridge CFDictionaryRef)(query), &dataTypeRef);
    if (status == errSecSuccess)
    {
        NSData *resultData = ( __bridge_transfer NSData *)dataTypeRef;
        NSDictionary *jsonResult = [NSJSONSerialization JSONObjectWithData:resultData options:0 error:nil];
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsDictionary:jsonResult];
    } else {
        NSString *statusMsg = [self keychainErrorToString:status];
        msg = [NSString stringWithFormat:@"SEC_ITEM_COPY_MATCHING_STATUS : %@", statusMsg];
        
        pluginResult = [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:statusMsg];
    }
    [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
    NSLog(@"message: %@", msg);
}

- (void)deleteItem
{
    NSDictionary *query = @{
                            (__bridge id)kSecClass: (__bridge id)kSecClassGenericPassword,
                            (__bridge id)kSecAttrService: serviceIdentifie,
                            (__bridge id)kSecAttrAccount: accountName
                            };
    
    OSStatus status = SecItemDelete((__bridge CFDictionaryRef)(query));
    NSString *msg = [NSString stringWithFormat:NSLocalizedString(@"SEC_ITEM_DELETE_STATUS : ", nil), [self keychainErrorToString:status]];
    NSLog(msg);
}

- (NSString *)keychainErrorToString: (OSStatus)error
{
    
    NSString *msg = [NSString stringWithFormat:@"%ld",(long)error];
    
    switch (error) {
        case errSecSuccess:
            msg = NSLocalizedString(@"SUCCESS", nil);
            break;
        case errSecDuplicateItem:
            msg = NSLocalizedString(@"ERROR_ITEM_ALREADY_EXISTS", nil);
            break;
        case errSecItemNotFound :
            msg = NSLocalizedString(@"ERROR_ITEM_NOT_FOUND", nil);
            break;
        case errSecAuthFailed:
            msg = NSLocalizedString(@"ERROR_ITEM_AUTHENTICATION_FAILED", nil);
            break;
        default:
            break;
    }
    
    return msg;
}

@end
