
using Microsoft.Phone.Controls;
using System.Diagnostics;
using System.Windows;
namespace WPCordovaClassLib.Cordova.Commands
{
    class CookiesManager : BaseCommand
    {
        public void clear(string options)
        {
            Deployment.Current.Dispatcher.BeginInvoke(() =>
            {
                getCordovaBrowserAndClearCookies();
            });
        }

        private void getCordovaBrowserAndClearCookies()
        {
            PluginResult result;
            PhoneApplicationFrame frame = Application.Current.RootVisual as PhoneApplicationFrame;
            if (frame != null)
            {
                PhoneApplicationPage page = frame.Content as PhoneApplicationPage;
                if (page != null)
                {
                    CordovaView cordovaView = page.FindName("CordovaView") as CordovaView;
                    if (cordovaView != null)
                    {
                        WebBrowser br = cordovaView.CordovaBrowser;
                        if (br != null)
                        {
                            br.ClearInternetCacheAsync();
                            result = new PluginResult(PluginResult.Status.OK, "success cleared cookies");
                            DispatchCommandResult(result);
                            return;
                        }
                    }
                }
            }

            Debug.WriteLine("Error : getting Cordova WebBrowser was failed");
            result = new PluginResult(PluginResult.Status.ERROR);
            this.DispatchCommandResult(result);
        }
    }
}