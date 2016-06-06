/*  
	Licensed under the Apache License, Version 2.0 (the "License");
	you may not use this file except in compliance with the License.
	You may obtain a copy of the License at
	
	http://www.apache.org/licenses/LICENSE-2.0
	
	Unless required by applicable law or agreed to in writing, software
	distributed under the License is distributed on an "AS IS" BASIS,
	WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	See the License for the specific language governing permissions and
	limitations under the License.
*/

using System;
using System.Net;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Documents;
using System.Windows.Ink;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Animation;
using System.Windows.Shapes;
using Microsoft.Phone.Info;
using System.IO.IsolatedStorage;
using System.Windows.Resources;
using System.IO;
using System.Diagnostics;
using Windows.Networking.Proximity;

namespace WPCordovaClassLib.Cordova.Commands
{
    public class DeviceInfoPlugin : BaseCommand
    {
        public void getDeviceInfo(string notused)
        {
            string res = String.Format("\"platformType\":\"{0}\",\"platformVersion\":\"{1}\",\"manufacturer\":\"{2}\",\"model\":\"{3}\",\"id\":\"{4}\",\"nfc\":\"{5}\"",
                                        "windowsphone",//platformType
                                        this.platformVersion,
                                        this.manufacturer,                                        
                                        this.model,
                                        this.deviceID,
                                        this.isNFCSuppported
                                        );

            res = "{" + res + "}";
            //Debug.WriteLine("Result::" + res);
            DispatchCommandResult(new PluginResult(PluginResult.Status.OK, res));
        }

        public string model
        {
            get
            {
                return DeviceStatus.DeviceName;
                //return String.Format("{0},{1},{2}", DeviceStatus.DeviceManufacturer, DeviceStatus.DeviceHardwareVersion, DeviceStatus.DeviceFirmwareVersion); 
            }
        }

        public string manufacturer
        {
            get
            {
                return DeviceStatus.DeviceManufacturer;
            }
        }

        public string name
        {
            get
            {
                return DeviceStatus.DeviceName;
                
            }
        }

        public string platformVersion
        {
            get
            {
                return Environment.OSVersion.Version.ToString();
            }
        }


        public object deviceID
        {
            get
            {
                //NOTE: for WP 8 this workk like iOS deviceID (https://msdn.microsoft.com/library/windows/apps/microsoft.phone.info.deviceextendedproperties(v=vs.105).aspx)
                return Convert.ToBase64String((byte[])DeviceExtendedProperties.GetValue("DeviceUniqueId"));
            }
        }

        public object isNFCSuppported {
            get {
                return ProximityDevice.GetDefault() != null;
            } 
        }
    }
}
