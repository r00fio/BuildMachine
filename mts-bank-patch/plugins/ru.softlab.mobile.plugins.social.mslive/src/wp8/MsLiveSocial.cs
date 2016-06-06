using System;
using System.Collections.Generic;
using System.Windows;
using System.Diagnostics;
using Microsoft.Live;
using System.IO;
using System.Text;
using Newtonsoft.Json;
using System.Net;

namespace WPCordovaClassLib.Cordova.Commands
{
    class MsLiveSocial : BaseCommand
    {
        static string APP_CLIENT_ID = "000000004C15728B";
        LiveConnectClient liveClient;
        LiveAuthClient auth;

        IDictionary<string, object> userInfo;
        IList<object> friendsInfo;

        public MsLiveSocial()
        {
            userInfo = new Dictionary<string,object>();
            friendsInfo = new List<object>();
        }

        public void login(string options)
        {
            startLoginTask();
        }

        public void getUserInfo(string options)
        {
            try
            {
                if (this.auth != null && this.auth.Session != null)
                {
                    getUserInfoAsync();
                }
                else
                {
                    startLoginTask();
                }
            }
            catch (LiveAuthException e)
            {
                Debug.WriteLine("GetUserInfo. LiveAuthException : " + e.Message);
                setErrorResult(e.Message);
            }
            catch (LiveConnectException e)
            {
                Debug.WriteLine("GetUserInfo. LiveConnectException : " + e.Message);
                setErrorResult(e.Message);
            }
        }

        public void logout(string options)
        {
            Action actionLogout = () =>
            {
                logoutAsync();
            };
            Deployment.Current.Dispatcher.BeginInvoke(actionLogout);
        }

        //------------------------------------
        // 
        // LOCAL METHODS
        // -----------------------------------

        private void startLoginTask()
        {
            Action actionLogin = () =>
            {
                loginAsync();
            };
            Deployment.Current.Dispatcher.BeginInvoke(actionLogin);
        }

        private async void loginAsync()
        {
            try
            {
                this.auth = new LiveAuthClient(APP_CLIENT_ID);
                LiveLoginResult initializeResult = await this.auth.InitializeAsync();
                try
                {
                    LiveLoginResult loginResult = await this.auth.LoginAsync(new string[] { "wl.basic", "wl.signin" });
                    if (loginResult.Status == LiveConnectSessionStatus.Connected)
                    {
                        Debug.WriteLine("Success signing in : " + loginResult.Status.ToString());

                        this.liveClient = new LiveConnectClient(this.auth.Session);
                        getUserInfoAsync();
                    }
                    else
                    {
                        setErrorResult("Cansel signing in. LiveLoginResult.Status = " + loginResult.Status.ToString());
                    }
                }
                catch (LiveAuthException e)
                {
                    Debug.WriteLine("Login. LiveAuthException : " + e.Message);
                    setErrorResult(e.Message);
                }
                catch (LiveConnectException e)
                {
                    Debug.WriteLine("Login. LiveConnectException : " + e.Message);
                    setErrorResult(e.Message);
                }
            }
            catch (LiveAuthException e) {
                Debug.WriteLine("Initialization. LiveAuthException : " + e.Message);
                setErrorResult(e.Message);
            }
        }

        private async void getUserInfoAsync()
        {
            try
            {
                LiveOperationResult operationResult = await this.liveClient.GetAsync("me");
                IDictionary<string, object> result = operationResult.Result;
                if (result != null)
                {
                    IDictionary<string, object> obj = new Dictionary<string,object>();
                    obj.Add("id", result["id"]);
                    obj.Add("first_name", result["first_name"]);
                    obj.Add("last_name", result["last_name"]);

                    userInfo = obj;
                    getMyProfilePictureAsync();
                }
                else
                {
                    Debug.WriteLine("Error getting info about me");
                    setErrorResult("Login was failed!");
                }
            }
            catch (LiveConnectException e)
            {
                Debug.WriteLine("GetUserInfoAsync. LiveConnectException : " + e.Message);
                setErrorResult(e.Message);
            }
        }

        private async void getMyProfilePictureAsync()
        {
            try
            {
                LiveOperationResult operationResult = await this.liveClient.GetAsync("me/picture");
                dynamic result = operationResult.Result;
                if (result != null) {
                    string location = result.location;
                    loadImageAsync(location);
                }
                else
                {
                    userInfo.Add("photo", "");
                }
            }
            catch (LiveConnectException e)
            {
                Debug.WriteLine("GetMyProfilePicture. LiveConnectException : " + e.Message);
                setErrorResult(e.Message);
            }
        }

        private async void loadImageAsync(string url)
        {
            try
            {
                System.Uri uri = new Uri(url);
                HttpWebRequest request = (HttpWebRequest)WebRequest.Create(uri);
                RequestState myRequestState = new RequestState();
                myRequestState.request = request;
                IAsyncResult result = (IAsyncResult)request.BeginGetResponse(new AsyncCallback(RespCallback), myRequestState);
            }
            catch (WebException e)
            {
                Debug.WriteLine("Exception : " + e.Message + " ; " + e.Status);
                setImageInfoAndGetFriendsInfo("");
            }
            catch (Exception e)
            {
                Debug.WriteLine("Exception : " + e.Message);
                setImageInfoAndGetFriendsInfo("");
            }
        }

        private void setImageInfoAndGetFriendsInfo(string imageBase64)
        {
            userInfo.Add("photo", imageBase64);
            getFriendsListAsync();
        }

        private async void getFriendsListAsync()
        {
            try
            {
                LiveOperationResult operationResult = await this.liveClient.GetAsync("me/friends");
                IDictionary<string, object> result = operationResult.Result;
                if (result != null)
                {
                    IList<object> obj = new List<object>();
                    obj = (List<object>)(result["data"]);
                    if (obj.Count == 0)
                    {
                        friendsInfo = obj;
                    }
                    else
                    {
                        foreach (IDictionary<string, object> item in obj)
                        {
                            IDictionary<string, object> elem = new Dictionary<string, object>();
                            elem.Add("id", item["id"]);
                            elem.Add("first_name", item["first_name"]);
                            elem.Add("last_name", item["last_name"]);
                            elem.Add("photo", item["photo"]);
                            friendsInfo.Add(elem);
                        }
                    }
                }

                UserInfoJSON res = new UserInfoJSON(userInfo, friendsInfo);
                string json = JsonConvert.SerializeObject(res);

                setSuccessResult(json);
            }
            catch (LiveConnectException e)
            {
                Debug.WriteLine("GetFriendsListAsync. LiveConnectException : " + e.Message);
                setErrorResult(e.Message);
            }
        }

        private async void logoutAsync()
        {
            try
            {
                if (this.auth != null)
                {
                    this.auth.Logout();
                    this.liveClient = null;
                    setSuccessResult("Logout was success.");
                }
            }
            catch (LiveAuthException e)
            {
                Debug.WriteLine("logoutAsync. LiveAuthException : " + e.Message);
                setErrorResult(e.Message);
            }
        }

        private void setSuccessResult(string message)
        {
            PluginResult result = new PluginResult(PluginResult.Status.OK, message);
            DispatchCommandResult(result);
        }

        private void setErrorResult(string message)
        {
            PluginResult result = new PluginResult(PluginResult.Status.ERROR, message);
            DispatchCommandResult(result);
        }


        public class UserInfoJSON
        {
            public IDictionary<string, object> userInfo { get; set; }

            public IList<object> friendsInfo { get; set; }

            public UserInfoJSON() { }

            public UserInfoJSON(IDictionary<string, object> newUserInfo, IList<object> newFriendsInfo)
            {
                userInfo = newUserInfo;
                friendsInfo = newFriendsInfo;
            }
        }

        public class RequestState
        {
            const int BUFFER_SIZE = 1024;
            public StringBuilder requestData;
            public byte[] BufferRead;
            public HttpWebRequest request;
            public HttpWebResponse response;
            public Stream streamResponse;

            public RequestState()
            {
                BufferRead = new byte[BUFFER_SIZE];
                requestData = new StringBuilder("");
                request = null;
                streamResponse = null;
            }
        }

        private void RespCallback(IAsyncResult asynchronousResult)
        {
            string imageBase64 = "";
            try
            {
                RequestState myRequestState = (RequestState)asynchronousResult.AsyncState;
                HttpWebRequest request = myRequestState.request;
                myRequestState.response = (HttpWebResponse)request.EndGetResponse(asynchronousResult);
                Stream responseStream = myRequestState.response.GetResponseStream();

                var memoryStream = new MemoryStream();
                responseStream.CopyTo(memoryStream);
                byte[] bytes = memoryStream.ToArray();

                imageBase64 = Convert.ToBase64String(bytes, 0, bytes.Length);
                /* Debug.WriteLine("ImageData in base64 : " + imageBase64); */

                setImageInfoAndGetFriendsInfo(imageBase64);

                responseStream.Close();
                myRequestState.response.Close();
            }
            catch (WebException e)
            {
                Debug.WriteLine(e.Message);
                setImageInfoAndGetFriendsInfo("");
            }
        }
    }
}