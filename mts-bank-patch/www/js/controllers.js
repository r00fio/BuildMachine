/**
 * Контроллеры (ng-controller)
 */
(function (config) {
    var module = angular.module('app');

    module.controller('StartCtrl', ['$q', '$scope', '$rootScope', '$state', '$ionicModal', '$ionicSlideBoxDelegate', '$timeout', 'sys', 'WebWorker',
    function($q, $scope, $rootScope, $state, $ionicModal, $ionicSlideBoxDelegate, $timeout, sys, WebWorker) {

        /* Отложенная задача по запуску автопрокрутки карусели после закрытия туториала */
        var carouselDeferred = $q.defer();
        var startCarousel = function(carouselElem){
            carouselElem.trigger('owl.play', 5000); // Второй параметр - интервал смены слайдов карусели
        };

        $rootScope.prefetchBackground();

            /* ------- Модальное окно с туториалом ------- */
            if (!$state.current.lastVisit) {
                $scope.globals.firstLaunch = true;

                $ionicModal.fromTemplateUrl('templates/ios/help/tutorial.html', function ($ionicModal) {
                    $ionicModal.show();

                var scope = $ionicModal.scope;
                var tutorialSlideBox = $ionicSlideBoxDelegate.$getByHandle('tutorial-slide-box');

                scope.hideTutorial = function () {
                    $ionicModal.hide();
                    carouselDeferred.promise.then(startCarousel);
                };

                var isLastSlide = function () {
                    return tutorialSlideBox.currentIndex() >= tutorialSlideBox.slidesCount() - 1;
                };

                scope.tutorialNextSlide = function () {
                    return isLastSlide() ? scope.hideTutorial() : tutorialSlideBox.next();
                };

                scope.tutorialSlideHasChanged = function () {
                    scope.tutorialButtonText = isLastSlide() ? 'Начать работу' : 'Хорошо';
                    scope.$applyAsync();
                };
                $timeout(function () {
                    scope.tutorialSlideHasChanged(0)
                });
            }, {
                scope: $scope
            });
        } else {
            carouselDeferred.promise.then(startCarousel);
        }
        /* ------------------------------------ */

        $rootScope.isAuthorized = false;
        $rootScope.disableHandShaker();

        var loadGallery = function() {
            var carouselDefaults = {
                singleItem: true,
                slideSpeed: 300,
                //autoPlay: 5000,
                autoPlay: false, //autoPlay назначается в функции отложенного запуска карусели при генерации события 'owl.play'
                paginationSpeed: 300,
                rewindSpeed: 900,
                navigation: false,
                scrollPerPage: true,
                itemsDesktop: false,
                itemsDesktopSmall: false,
                itemsTablet: false,
                itemsMobile: false
            };
            var carouselTextConf = $.extend({}, carouselDefaults, {
                theme: 'owl-text-theme',
                mouseDrag: false,
                touchDrag: false
            });

            var imgCarouselElem = $("#startpage-img-gallery").owlCarousel(carouselDefaults).data('owlCarousel').$elem;
            $("#startpage-text-gallery").owlCarousel(carouselTextConf);

            $("#startpage-text-gallery").synchronizeOwlWith($("#startpage-img-gallery"));

            carouselDeferred.resolve(imgCarouselElem);
        };

        setTimeout(function(){
            loadGallery();
        }, 0);

        setTimeout(function(){
            if (navigator && navigator.splashscreen) {
                navigator.splashscreen.hide();
            }
        }, 2000);

        if (sys.getPlatform() === 'ios') {
            $ionicModal.fromTemplateUrl('templates/' + sys.getPlatform() + '/auth/menu.html', function($ionicModal) {
                $scope.menu = $ionicModal;
            }, {
                scope: $scope
            });
        }
    }]);

    module.controller('TabbarCtrl', ['$scope', '$state', function($scope, $state) {
            var statesTabHome = ['home', 'news', 'notice', 'homeoperation'];
            var statesTabProducts = ['myfinances', 'products', 'accountopenreq', 'issuevirtualcard', 'depositselect',
                'depositparams', 'cards', 'card', 'account', 'deposit', 'depositcompare', 'depositcompareparams',
                'loan'];
            var statesTabPays = ['payments'];
            var statesTabExpenses = ['controllingcosts', 'categorybudget', 'settingbudget'];
            var statesTabOther = ['settings', 'calendarevents'];

            $scope.isActiveTab = function(tab) {
                if (tab == 'home') {
                    for (var i = 0; i < statesTabHome.length; i++) {
                        var parentState = $state.current.name.split('.')[0];
                        if (parentState == statesTabHome[i]) {
                            return true;
                        }
                    }
                    return false;
                }
                if (tab == 'products') {
                    for (var i = 0; i < statesTabProducts.length; i++) {
                        var parentState = $state.current.name.split('.')[0];
                        if (parentState == statesTabProducts[i]) {
                            return true;
                        }
                    }
                    return false;
                }
                if (tab == 'pays') {
                    for (var i = 0; i < statesTabPays.length; i++) {
                        var parentState = $state.current.name.split('.')[0];
                        if (parentState == statesTabPays[i]) {
                            return true;
                        }
                    }
                    return false;
                }
                if (tab == 'expenses') {
                    for (var i = 0; i < statesTabExpenses.length; i++) {
                        var parentState = $state.current.name.split('.')[0];
                        if (parentState == statesTabExpenses[i]) {
                            return true;
                        }
                    }
                    return false;
                }
                if (tab == 'other') {
                    for (var i = 0; i < statesTabOther.length; i++) {
                        var parentState = $state.current.name.split('.')[0];
                        if (parentState == statesTabOther[i]) {
                            return true;
                        }
                    }
                    return false;
                }
            }
    }]);

    module.controller('AppmenuCtrl', ['$scope', '$state', 'sys', 'WebWorker', 'persistence', function($scope, $state, sys, WebWorker, persistence) {
        $scope.isActiveItem = function(item) {
            var parentState = $state.current.name.split('.')[0];
            if (item == 'home') {
                return ['home', 'homeoperation'].indexOf(parentState) >= 0;
            }
            if (item == 'myfinances') {
                return ['myfinances', 'account', 'cards', 'card', 'autopaylist', 'autopay', 'deposit', 'loan'].indexOf(parentState) >= 0 ;
            }
            if (item == 'favourites') {
                return ['favourites'].indexOf(parentState) >= 0;
            }
            if (item == 'payments') {
                return ['payments', 'paycategories', 'rubpayment', 'servicepay', 'transfer', 'ictransfer', 'paymenttocard', 'paymenttofriend'].indexOf(parentState) >= 0;
            }
            if (item == 'controllingcosts') {
                return ['controllingcosts', 'categorybudget', 'settingbudget', 'controllingcostsfilter'].indexOf(parentState) >= 0;
            }
            if (item == 'bonuses') {
                return ['bonuses'].indexOf(parentState) >= 0;
            }
            if (item == 'calendarevents') {
                return ['calendarevents'].indexOf(parentState) >= 0;
            }
            if (item == 'news') {
                return ['news'].indexOf(parentState) >= 0;
            }
            if (item == 'notice') {
                return ['notice'].indexOf(parentState) >= 0;
            }
            if (item == 'help') {
                return ['help', 'onlinechat'].indexOf(parentState) >= 0;
            }
            if (item == 'currates') {
                return ['currates'].indexOf(parentState) >= 0;
            }
            if (item == 'ideabank') {
                return ['ideabank'].indexOf(parentState) >= 0;
            }
            if (item == 'atmsandoffices') {
                return ['atmsandoffices'].indexOf(parentState) >= 0;
            }
            if (item == 'unauth_news') {
                return ['unauth_news'].indexOf(parentState) >= 0;
            }
            if (item == 'login') {
                return ['login'].indexOf(parentState) >= 0;
            }
        };

        $scope.showNews = function() {
            sys.clearWebViewCookies().then(function(){
                WebWorker.postMessage('getNews', 'getNews');
            });
            $state.go('unauth_news');
        };

        $scope.goToLogin = function() {
            var authMode = persistence.get('authMode');
            if (authMode == 'shortCode' || authMode == 'touchID') {
                $state.go('login.shortCode');
            } else {
                $state.go('login.password');
            }

        };
    }]);

    module.controller('HomeCtrl', ['$scope', '$state', '$ionicSlideBoxDelegate', '$ionicModal', '$filter', 'commonSrv', 'productSrv', 'bankNews', 'costControll', 'chat', 'ideabank', 'WebWorker', '$rootScope', 'paymentSrv',
    function($scope, $state, $ionicSlideBoxDelegate, $ionicModal, $filter, commonSrv, productSrv, bankNews, costControll, chat, ideabank, WebWorker, $rootScope, paymentSrv) {
        $scope.activeSlide = 0;
        $scope.operationState = 'homeoperation';
        $rootScope.isAuthorized = true;
        delete($scope.globals.firstLaunch);

        $rootScope.initHandShaker();

        $scope.favoritList = paymentSrv.getFavouritesList();

        /* Анимация аппендиксов в короне START */
        var duration = 1500;
        var easing = mina.easeinout;

        var animateAppendixHelp = function() {
            if (angular.element('#Oval-1') && angular.element('#Oval-1-icon')) {
                //Левый круг
                Snap("#Oval-1").animate({cx:200, cy:140}, duration, easing);
                //Иконка в левом круге
                Snap("#Oval-1-icon").animate({transform:new Snap.Matrix().translate(170,110)}, duration, easing);
            }
        };

        var animateAppendixControl = function() {
            if (angular.element('#Oval-2') && angular.element('#Oval-2-icon')) {
                //Средний круг
                Snap("#Oval-2").animate({cx: 320, cy: 100}, duration, easing);
                //Иконка в среднем круге
                Snap("#Oval-2-icon").animate({transform: new Snap.Matrix().translate(304, 83)}, duration, easing);
            }
        };

        var animateAppendixIdeas = function() {
            if (angular.element('#Oval-3') && angular.element('#Oval-3-icon')) {
                //Правый круг
                Snap("#Oval-3").animate({cx: 450, cy: 140}, duration, easing);
                //Иконка в правом круге
                Snap("#Oval-3-icon").animate({transform: new Snap.Matrix().translate(421, 110)}, duration, easing);
            }
        };
        /* Анимация аппендиксов в короне END */

        var assignRetailClient = function(result) {
            $rootScope.retailClient = result.data;
        };

        var assignFavouritesPayments = function(result) {
            paymentSrv.setFavouritesList(result.data);
            $scope.favoritList = paymentSrv.getFavouritesList();
            if (!$scope.favoritList) {
                $scope.favoritList = [];
            }
        };

        var assignNews = function(result) {
            bankNews.setNews(result.data);
            $scope.advertList = bankNews.getAdvertList();
            $ionicSlideBoxDelegate.update();
        };

        var assignAggregateBalance = function(result) {
            $scope.balance = result.data;
            commonSrv.setAggregateBalance($scope.balance);
        };

        $scope.$on('newChatMessagesArrived', function(){
            animateAppendixHelp();
        });

        var assignIdeas = function(result) {
            ideabank.setIdeas(result.data);
            var showAppendixIdeas = ideabank.showAppendix(); // новая опубликованная идея
            if (showAppendixIdeas) {
                animateAppendixIdeas();
            }
        };

        var assignOnlineOperations = function(result) {
            $scope.operationList = result.data;
            $scope.$broadcast('scroll.refreshComplete');
        };

        var assignControllingCosts = function(result) {
            if (result.data && result.data.costs) {
                costControll.setCosts(result.data.costs);
                var showAppendixControl = costControll.showAppendix(); // превышение комфортного баланса (Контроль расходов)
                if (showAppendixControl) {
                    animateAppendixControl();
                }
            }
        };

        /* Идеи, чат (вызов в rootScope) и контроль расходов для короны запрашиваются первыми */
        if (!ideabank.getIdeas()) {
            WebWorker.invoke('getIdeas').then(assignIdeas);
        }
        //var costParams = {};
        //costParams.refresh = false;
        //costParams.fromHomePage = true;
        //costParams.month = new Date().getMonth() % 12;
        //WebWorker.invoke('getControllingCosts', costParams).then(assignControllingCosts);

        WebWorker.invoke('getRetailClient').then(assignRetailClient);
        if (commonSrv.getAggregateBalance()) {
            $scope.balance = commonSrv.getAggregateBalance();
        } else if ($scope.globals.successAfterLogin) {
            WebWorker.invoke('getAggregateBalance').then(assignAggregateBalance);
        }
        if (bankNews.getNews()) {
            $scope.advertList = bankNews.getAdvertList();
        } else {
            WebWorker.invoke('getNews', 0, 10, 'news,promotion,advert').then(function(result) {
                assignNews(result);
                bankNews.showImportant();
            });
        }
        if (paymentSrv.getFavouritesList()) {
            $scope.favoritList = paymentSrv.getFavouritesList();
        } else {
            WebWorker.invoke('getFavouritesPayments').then(assignFavouritesPayments);
        }
        WebWorker.invoke('getOnlineOperations', 'HOME', 5).then(assignOnlineOperations);

        /* после afterLogin обновляем клиента и запрашиваем агр баланс */
        $scope.$on('successAfterLogin', function(evt) {
            WebWorker.invoke('getRetailClient').then(assignRetailClient);
            WebWorker.invoke('getAggregateBalance').then(assignAggregateBalance);
        });

        $scope.homeMfbMenuClick = function() {
            if ($("div").is("#modal-mfb")) {
                $('#modal-mfb').addClass('opacity0');
                setTimeout(function(){
                    $('#modal-mfb').remove();
                }, 500);
            } else {
                $('#rootpane').append('<div id="modal-mfb" ng-click="closeMfbMenu()" class="modal-container opacity0" style="z-index: 10; transition: 0.5s;"></div>');
                setTimeout(function(){
                    $('#modal-mfb').removeClass('opacity0');
                }, 0);
            }
        };

        /* Обновление информации при оттягивании страницы. Pull to refresh. */
        $scope.doRefresh = function() {
            WebWorker.invoke('getRetailClient').then(assignRetailClient);
            WebWorker.invoke('getFavouritesPayments').then(assignFavouritesPayments);
            WebWorker.invoke('getAggregateBalance').then(assignAggregateBalance);
            WebWorker.invoke('getNews', 0, 10, 'news,promotion,advert').then(assignNews);
            WebWorker.invoke('getIdeas').then(assignIdeas);
            WebWorker.invoke('getOnlineOperations', 'HOME', 5).then(assignOnlineOperations);
            //costParams.refresh = true;
            //costParams.fromHomePage = true;
            //costParams.month = new Date().getMonth() % 12;
            //WebWorker.invoke('getControllingCosts', costParams).then(assignControllingCosts);
        };

        $scope.redirectToPayment = function (favourite) {
            if (!favourite.isGroup) {
                var params = paymentSrv.getParamsToRedirectFromFavourites(favourite.template, favourite, 'Избранные платежи');
                if (params) {
                    $state.go(params.link, params.linkParams);
                }
            }
        };

        /* Заглушечные данные */
        $scope.countNewEvents = 5;

    }]);

    module.controller('MyFinancesCtrl', ['$scope', '$state', '$timeout', '$filter', 'commonSrv','accountSrv', 'loanSrv', 'depositSrv', 'cardSrv', 'WebWorker', 'sys',
        function($scope, $state, $timeout, $filter, commonSrv, accountSrv, loanSrv, depositSrv, cardSrv, WebWorker, sys) {

            // Закомментировать если отключен WinJS
            /*$scope.cardMenu = null;
            WinJS.UI.processAll().done(function () {
                var cardMenuElement = angular.element('#winjsFinancesCardMenu')[0];
                $scope.cardMenu = cardMenuElement && $scope.platform === 'windowsphone' ? cardMenuElement.winControl : null;
            });*/

            $timeout(function(){
                // Подключение pull-to-refresh
                sys.getFramework7App().initPullToRefresh(Dom7('.pull-to-refresh-content'));
            });

            /**
             * Заполнение объединённого списка счетов и вкладов: открытые избранные счета вклады, открытые неизбранные счета вклады, закрытые счета вклады
             */
            var fillAccountDepositList = function() {
                var openFavouriteDeposits = $filter('objectArrayFilter')(depositSrv.getDepositList(), [{isFavourite: true, isClosed: false}]);
                var openNotFavouriteDeposits = $filter('objectArrayFilter')(depositSrv.getDepositList(), [{isFavourite: false, isClosed: false}]);
                var closedDeposits = $filter('objectArrayFilter')(depositSrv.getDepositList(), [{isClosed: true}]);
                var openFavouriteAccounts = $filter('objectArrayFilter')(accountSrv.getAccountList(), [{isFavourite: true, isClosed: false}]);
                var openNotFavouriteAccounts = $filter('objectArrayFilter')(accountSrv.getAccountList(), [{isFavourite: false, isClosed: false}]);
                var closedAccounts = $filter('objectArrayFilter')(accountSrv.getAccountList(), [{isClosed: true}]);
                $scope.accountDepositList = openFavouriteDeposits.concat(openNotFavouriteDeposits).concat(closedDeposits).
                    concat(openFavouriteAccounts).concat(openNotFavouriteAccounts).concat(closedAccounts);
                $scope.visibleAccsDeps = $scope.accountDepositList && $scope.accountDepositList.length > 0;
            };

            $scope.visibleCards = true;
            $scope.visibleLoans = true;
            $scope.visibleAccsDeps = true;

            var assignCardList = function(result) {
                cardSrv.setCardList(result.data);
                $scope.cardList = cardSrv.getSortedCardList();
                $scope.visibleCards = $scope.cardList && $scope.cardList.length > 0;
            };

            var assignLoanList = function(result) {
                loanSrv.setLoanList(result.data);
                $scope.loans = loanSrv.getSortedLoanList();
                $scope.visibleLoans = $scope.loans && $scope.loans.length > 0;
            };

            var assignDepositList = function(result) {
                depositSrv.setDepositList(result.data);
            };

            var assignAccountList = function(result) {
                accountSrv.setAccountList(result.data);
                fillAccountDepositList();

                // Выполняем в последнем запросе, чтобы скрыть вейтер обновления информации при Pull to refresh.
                var fw7App = sys.getFramework7App();
                fw7App.pullToRefreshDone();
                $scope.$broadcast('scroll.refreshComplete');
            };

            if (cardSrv.getCardList()) {
                $scope.cardList = cardSrv.getCardList();
                $scope.visibleCards = $scope.cardList && $scope.cardList.length > 0;
            } else {
                WebWorker.invoke('getCardList').then(assignCardList);
            }
            if (loanSrv.getLoanList()) {
                $scope.loans = loanSrv.getLoanList();
                $scope.visibleLoans = $scope.loans && $scope.loans.length > 0;
            } else {
                WebWorker.invoke('getLoanList').then(assignLoanList);
            }
            if (depositSrv.getDepositList()) {
                $scope.depositList = depositSrv.getDepositList();
            } else {
                WebWorker.invoke('getDepositList').then(assignDepositList);
            }
            if (accountSrv.getAccountList()) {
                $scope.accountList = accountSrv.getAccountList();
                fillAccountDepositList();
            } else {
                WebWorker.invoke('getAccountList').then(assignAccountList);
            }

            $scope.currency = ['RUB', 'USD', 'EUR'];
            $scope.selectedCurrencyForAccount = 'RUB';

            $scope.scrollToTop = function() {
                $$('.page-content').scrollTop(0, 500);
            };

            /* Pull to refresh */
            var $$ = Dom7;
            var ptrContent = $$('.pull-to-refresh-content');
            ptrContent.on('refresh', function (e) {
                $scope.doRefresh();
            });

            $scope.doRefresh = function() {
                WebWorker.invoke('getCardList').then(assignCardList);
                WebWorker.invoke('getLoanList').then(assignLoanList);
                WebWorker.invoke('getDepositList').then(assignDepositList);
                WebWorker.invoke('getAccountList').then(assignAccountList);
            };

            // Скрытие/отображение продукта
            $scope.toggleHidden = function(product){
                // $timeout для выполнения анимации удаления
                $timeout(function(){
                    product.isFavourite = !product.isFavourite;
                    WebWorker.postMessage('setIsFavourite', 'setIsFavourite', [product, product.isFavourite]);
                    $scope.$applyAsync();
                }, 300);
            };

            // Блокирование/разблокирование карт
            $scope.toggleBlocked = function(evt, bankCard){
                sys.getFramework7App().swipeoutClose(evt.target.parentElement.parentElement, function(){
                    cardSrv.setBlocked(bankCard, bankCard.canBlock);
                });
            };
        }]);

    module.controller('ProductsCtrl', ['$scope', 'WebWorker', function($scope, WebWorker) {
        function processingResults(data) {
                switch (data.cmdInfo) {
                    case 'getRetailReqDocBaseList':
                        $scope.retailDocList = data.result.data;
                        break;
                }
                $scope.$apply();
        }
        WebWorker.setFunction(processingResults);

        WebWorker.postMessage('getRetailReqDocBaseList', 'getRetailReqDocBaseList');
    }]);

    module.controller('SchedulePaymentCtrl', ['$scope', '$stateParams', function($scope, $stateParams) {
        $scope.payment = $stateParams.payment;
        $scope.loanCurrency = $stateParams.loan.currency;
    }]);

    module.controller('SMSBankInfoCtrl', ['$scope', '$stateParams', '$state', 'productSrv', 'commonSrv', 'WebWorker', '$ionicModal', 'sys',
    function($scope, $stateParams, $state, productSrv, commonSrv, WebWorker, $ionicModal, sys) {
        $scope.form = {};

        if ($scope.globals.dataObjectForSessionTimeout) {
            initBySessionTimeout();
        } else {
            init();
        }

        function initBySessionTimeout() {
            $scope.form = $scope.globals.dataObjectForSessionTimeout;
            delete($scope.globals.dataObjectForSessionTimeout);
            if (!$scope.form.tariffOptionList) {
                requestData();
            }
        }

        function init() {
            $scope.form.product = productSrv.getCurrentProduct();
            $scope.form.isCard = $scope.form.product.entityKind == 'BankCard';
            $scope.form.condition = $stateParams.hasBonusProgram && $scope.form.product.productServices.canPayBonuses ? 'true' : 'value == \"MONEY\"';
            $scope.form.option = $scope.form.product.productServices.smsInfo;
            requestData();
        }

        function requestData() {
            $scope.saveDataForSessionTimeout($scope.form);
            WebWorker.postMessage("getTariffOptionsSMSBankInfo", "getTariffOptionsSMSBankInfo", [$scope.form.product]);
            if ($scope.form.isCard) {
                WebWorker.postMessage("getEntitiesByCondition", "getPaymentMethodList", ['codifier', 'RetailPayMethod', $scope.form.condition]);
            }
        }

        /* для подтверждений */
        var activateActionStrId = 'ConnectingServiceAction';
        var deactivateActionStrId = 'DisablingServiceAction';
        var args = [];
        /* для подтверждений */

        /* обновление услуг и опций после действия с ними */
        var getProductServices = function(product) {
            return function() {
                WebWorker.invoke('getProductServices', product).then(
                    function(result) {
                        product.productServices = result.data;
                    }
                );
            }
        };

        function processingResults(data) {
                switch (data.cmdInfo) {
                    case 'getTariffOptionsSMSBankInfo':
                        $scope.form.tariffOptionList = data.result.data || [];
                        $scope.form.selectedTariff = $scope.form.tariffOptionList[0];
                        break;
                    case 'getPaymentMethodList':
                        $scope.paymentMethodList = data.result.data || [];
                        $scope.selectedMethod = $scope.paymentMethodList[0];
                        break;
                    case 'sendSMSBankInfoRequest':
                        // <для подтверждения одноразовым паролем>
                        if (data.result.data == 'otpConfirm' || data.result.data == 'codeDateConfirm') {
                            $scope.confirmationShow(data.cmdInfo, args, data.result.data == 'otpConfirm');
                            return;
                        } else if (data.result.data == 'true') {
                            $scope.showButton = false;
                            $scope.confirmationHide();

                            // Действия после успешной отправки.
                            alert('Заявка отправлена').finally(function() {
                                $scope.goBack();
                            });
                            getProductServices(product)();
                        } else if (data.result.data == 'otpFalse' || data.result.data == 'codeDateFalse') {
                            $scope.confirmationFalse(data.result.data);
                            return;
                        } else {
                            $scope.confirmationHide();
                            $scope.showButton = true;
                            alert(data.result.data);
                        }
                        // </для подтверждения одноразовым паролем>
                        break;
                }
                $scope.$apply();
        }
        WebWorker.setFunction(processingResults);

        $scope.activate = function() {
            if (!$scope.form.selectedTariff) {
                alert('Выберите тариф');
                return;
            }
            args = [activateActionStrId, $scope.form.product, 'true', $scope.form.selectedTariff, null, $scope.form.selectedMethod, $scope.form.selectedTariff.amount];
            $scope.saveDataForSessionTimeout($scope.form);
            WebWorker.postMessage("sendSMSBankInfoRequest", "sendSMSBankInfoRequest", args);
        };

        $scope.deactivate = function() {
            args = [deactivateActionStrId, $scope.form.product, 'false'];
            $scope.saveDataForSessionTimeout($scope.form);
            WebWorker.postMessage("sendSMSBankInfoRequest", "sendSMSBankInfoRequest", args);
        };

        // <выбор продукта>
        $ionicModal.fromTemplateUrl('templates/' + sys.getPlatform() + '/selectproduct.html', function($ionicModal) {
            $scope.selectProduct = $ionicModal;
        }, {
            scope: $scope
        });

        $scope.selectProductShow = function(productList, resultId) {
            $scope.resultId = resultId;
            $scope.cardList = [];
            $scope.loanList = [];
            $scope.accountList = [];
            $scope.depositList = [];
            for (var i = 0; i < productList.length; i++) {
                if (productList[i].entityKind == 'BankCard') {
                    $scope.cardList.push(productList[i]);
                } else if (productList[i].entityKind == 'RetailLoan') {
                    $scope.loanList.push(productList[i]);
                } else if (productList[i].entityKind == 'RetailAccount') {
                    $scope.accountList.push(productList[i]);
                } else if (productList[i].entityKind == 'RetailDeposit') {
                    $scope.depositList.push(productList[i]);
                }
            }
            $scope.selectProduct.show();
        };

        $scope.clickProduct = function(product) {
            $scope.selectProduct.hide();
            $scope.form[$scope.resultId] = product;
        };
        // </выбор продукта>

        // <выбор>
        $ionicModal.fromTemplateUrl('templates/' + sys.getPlatform() + '/select.html', function($ionicModal) {
            $scope.select = $ionicModal;
        }, {
            scope: $scope
        });

        $scope.selectShow = function(listForSelect, resultId, headerText, fieldId) {
            $scope.listForSelect = listForSelect;
            $scope.resultId = resultId;
            $scope.headerText = headerText;
            $scope.fieldId = fieldId;
            $scope.select.show();
        };

        $scope.selectHide = function() {
            $scope.select.hide();
        };

        $scope.clickItem = function(item) {
            $scope.select.hide();
            $scope.form[$scope.resultId] = item;
        };
        // </выбор>
    }]);

    module.controller('EmbassyDocCtrl', ['$scope', 'productSrv', 'WebWorker', '$ionicModal', 'sys', '$ionicLoading',
        function($scope, productSrv, WebWorker, $ionicModal, sys, $ionicLoading) {
            $scope.form = {};
            var product = productSrv.getCurrentProduct();

            if ($scope.globals.dataObjectForSessionTimeout) {
                initBySessionTimeout();
            } else {
                init();
            }

            function initBySessionTimeout() {
                $scope.form = $scope.globals.dataObjectForSessionTimeout;
                delete($scope.globals.dataObjectForSessionTimeout);
                if (!$scope.form.paymentSourceList) {
                    requestData();
                }
            }

            function init() {
                $scope.form.office = {};
                requestData();
            }

            function requestData() {
                $scope.saveDataForSessionTimeout($scope.form);
                WebWorker.postMessage("getPaymentSourceList", "getPaymentSourceList", [product]);
                WebWorker.postMessage("getEntitiesByCondition", "getTariffList", ['document', 'EmbassyInqTariff', 'true']);
                WebWorker.postMessage("getTermMakingEmbassyRef", "getTermMakingEmbassyRef");
            }

            function processingResults(data) {
                switch (data.cmdInfo) {
                    case 'getPaymentSourceList':
                        $scope.form.paymentSourceList = data.result.data || [];
                        $scope.form.selectedSource = $scope.form.paymentSourceList[0];
                        for (var i = 0; i < $scope.form.paymentSourceList.length; i++) {
                            if (product.id == $scope.form.paymentSourceList[i].id) {
                                $scope.form.selectedSource = $scope.form.paymentSourceList[i];
                                break;
                            }
                        }
                        break;
                    case 'getTariffList':
                        $scope.form.tariffList = data.result.data;
                        $scope.form.selectedTariff = $scope.form.tariffList[0];
                        break;
                    case 'getTermMakingEmbassyRef':
                        $scope.form.termMaking = data.result.data;
                        break;
                    case 'sendEmbassyDocRequest':
                        $ionicLoading.hide();
                        if (data.result.code == 0) {
                            alert('Заявка отправлена').finally(function() {
                                $scope.goBack();
                            });
                        } else {
                            alert('При отправке заявки произошла ошибка');
                        }
                        break;
                }
                $scope.$apply();
        }
        WebWorker.setFunction(processingResults);

        $scope.sendEmbassyDocRequest = function() {
            if (!$scope.form.office.branch) {
                alert('Выберите офис доставки');
                return;
            }
            $ionicLoading.show({
                templateUrl: 'templates/' + sys.getPlatform() + '/loading.html'
            });
            $scope.saveDataForSessionTimeout($scope.form);
            WebWorker.postMessage("sendEmbassyDocRequest", "sendEmbassyDocRequest", [$scope.form.selectedSource,
                $scope.form.office.branch, $scope.form.selectedTariff, $scope.form.comment]);
        };

        $ionicModal.fromTemplateUrl('templates/' + sys.getPlatform() + '/selectproduct.html', function($ionicModal) {
            $scope.selectProduct = $ionicModal;
        }, {
            scope: $scope
        });

        $scope.selectProductShow = function(productList, resultId) {
            $scope.resultId = resultId;
            $scope.cardList = [];
            $scope.loanList = [];
            $scope.accountList = [];
            $scope.depositList = [];
            for (var i = 0; i < productList.length; i++) {
                if (productList[i].entityKind == 'BankCard') {
                    $scope.cardList.push(productList[i]);
                } else if (productList[i].entityKind == 'RetailLoan') {
                    $scope.loanList.push(productList[i]);
                } else if (productList[i].entityKind == 'RetailAccount') {
                    $scope.accountList.push(productList[i]);
                } else if (productList[i].entityKind == 'RetailDeposit') {
                    $scope.depositList.push(productList[i]);
                }
            }
            $scope.selectProduct.show();
        };

        $scope.clickProduct = function(product) {
            $scope.selectProduct.hide();
            $scope.form[$scope.resultId] = product;
        };

        $ionicModal.fromTemplateUrl('templates/' + sys.getPlatform() + '/select.html', function($ionicModal) {
            $scope.select = $ionicModal;
        }, {
            scope: $scope
        });

        $scope.selectShow = function(listForSelect, resultId, headerText, fieldId) {
            $scope.listForSelect = listForSelect;
            $scope.resultId = resultId;
            $scope.headerText = headerText;
            $scope.fieldId = fieldId;
            $scope.select.show();
        };

        $scope.selectHide = function() {
            $scope.select.hide();
        };

        $scope.clickItem = function(item) {
            $scope.select.hide();
            $scope.form[$scope.resultId] = item;
        };
    }]);

    /* Закрытие счета/вклада */
    module.controller('ProductCloseCtrl', ['$scope', 'productSrv', 'WebWorker', '$ionicModal', 'sys', '$filter', 'accountSrv', 'depositSrv',
    function($scope, productSrv, WebWorker, $ionicModal, sys, $filter, accountSrv, depositSrv) {
        $scope.form = {};
        var product = productSrv.getCurrentProduct().deposit ? productSrv.getCurrentProduct().deposit : productSrv.getCurrentProduct();

        var actionStrId = 'RetailConfirmRequestAction';   // идентификатор защищаемого действия
        var args = null;        // аргументы защищаемого действия для его выполнения из контроллера подтверджения

        if ($scope.globals.dataObjectForSessionTimeout) {
            initBySessionTimeout();
        } else {
            init();
        }

        function initBySessionTimeout() {
            $scope.form = $scope.globals.dataObjectForSessionTimeout;
            delete($scope.globals.dataObjectForSessionTimeout);
            if (!$scope.form.productListForClosing) {
                requestData();
            }
        }

        function init() {
            $scope.form.canClose = true;
            requestData();
        }

        function requestData() {
            $scope.saveDataForSessionTimeout($scope.form);
            WebWorker.postMessage("getProductListForClosing", "getProductListForClosing");
            WebWorker.postMessage("getProductListForCredit", "getProductListForCredit", [product]);
        }

        function processingResults(data) {
            switch (data.cmdInfo) {
                case 'getProductListForClosing':
                    $scope.form.productListForClosing = $filter('objectArrayFilter')(accountSrv.getAccountList().concat(depositSrv.getDepositList()), data.result.data);
                    $scope.form.selectedProduct = $scope.form.productListForClosing[0];
                    for (var i = 0; i < $scope.form.productListForClosing.length; i++) {
                        if (product.id == $scope.form.productListForClosing[i].id) {
                            $scope.form.selectedProduct = $scope.form.productListForClosing[i];
                            break;
                        }
                    }
                    $scope.changeSelectedProduct();
                    break;
                case 'getProductListForCredit':
                    $scope.form.productListForCredit = $filter('objectArrayFilter')(accountSrv.getAccountList().concat(depositSrv.getDepositList()), data.result.data);
                    $scope.form.selectedProductForCredit = $scope.form.productListForCredit[0];
                    break;
                case 'checkAccountReference':
                    $scope.form.accountReference = data.result.data;
                    $scope.form.canClose = !$scope.form.accountReference;
                    break;
                case 'getExternalInterestAmount':
                    $scope.form.externalInterestAmount = data.result.data;
                    break;
                case 'getTransferAccount':
                    var transferAccount = data.result.data;
                    if (transferAccount != null) {
                        for (var i = 0; i < $scope.form.productListForCredit.length; i++) {
                            if (transferAccount.id == $scope.form.productListForCredit[i]) {
                                $scope.form.selectedProductForCredit = $scope.form.productListForCredit[i];
                                break;
                            }
                        }
                    }
                    $scope.form.canClose = $scope.form.externalInterestAmount && $scope.form.externalInterestAmount != null;
                    break;
                case 'sendProductClosingRequest':
                    // <для подтверждения одноразовым паролем>
                    if (data.result.data == 'otpConfirm' || data.result.data == 'codeDateConfirm') {
                        $scope.confirmationShow(data.cmdInfo, args, data.result.data == 'otpConfirm');
                        return;
                    } else if (data.result.data == 'true') {
                        $scope.confirmationHide();

                        // Действия после успешной отправки.
                        alert('Заявка отправлена').finally(function() {
                            $scope.goBack();
                        });
                    } else if (data.result.data == 'otpFalse' || data.result.data == 'codeDateFalse') {
                        $scope.confirmationFalse(data.result.data);
                        return;
                    } else {
                        $scope.confirmationHide();
                        alert(data.result.data);
                    }
                    // </для подтверждения одноразовым паролем>
                    break;
            }
            $scope.$apply();
        }
        WebWorker.setFunction(processingResults);

        $scope.changeSelectedProduct = function() {
            $scope.form.isDeposit = 'RetailDeposit' == $scope.form.selectedProduct.entityKind;
            $scope.form.title = $scope.form.isDeposit ? "вклад" : "счет";
            $scope.saveDataForSessionTimeout($scope.form);

            // выбрали вклад
            if ($scope.form.isDeposit) {
                WebWorker.postMessage("getProductListForCredit", "getProductListForCredit", [$scope.form.selectedProduct]);
                WebWorker.postMessage("getExternalInterestAmount", "getExternalInterestAmount", [$scope.form.selectedProduct]);
                WebWorker.postMessage("getEntityByCondition", "getTransferAccount", ['system', 'RetailAccount',
                    'number == "' + $scope.form.selectedProduct.transferAccount + '"']);
            }

            // выбрали счет
            if (!$scope.form.isDeposit) {
                WebWorker.postMessage("checkAccountReference", "checkAccountReference", [$scope.form.selectedProduct]);
                WebWorker.postMessage("getProductListForCredit", "getProductListForCredit", [$scope.form.selectedProduct]);
            }
        };

            $scope.sendOrder = function() {
                args = [actionStrId, $scope.form.selectedProduct, $scope.form.selectedProductForCredit];
                WebWorker.postMessage("sendProductClosingRequest", "sendProductClosingRequest", args);
            };

            // <выбор продукта>
            $ionicModal.fromTemplateUrl('templates/' + sys.getPlatform() + '/selectproduct.html', function($ionicModal) {
                $scope.selectProduct = $ionicModal;
            }, {
                scope: $scope
            });

            $scope.selectProductShow = function(productList, resultId) {
                $scope.resultId = resultId;
                $scope.cardList = [];
                $scope.loanList = [];
                $scope.accountList = [];
                $scope.depositList = [];
                for (var i = 0; i < productList.length; i++) {
                    if (productList[i].entityKind == 'BankCard') {
                        $scope.cardList.push(productList[i]);
                    } else if (productList[i].entityKind == 'RetailLoan') {
                        $scope.loanList.push(productList[i]);
                    } else if (productList[i].entityKind == 'RetailAccount') {
                        $scope.accountList.push(productList[i]);
                    } else if (productList[i].entityKind == 'RetailDeposit') {
                        $scope.depositList.push(productList[i]);
                    }
                }
                $scope.selectProduct.show();
            };

            $scope.clickProduct = function(product) {
                $scope.selectProduct.hide();
                $scope.form[$scope.resultId] = product;
                if ($scope.resultId == 'selectedProduct') {
                    $scope.changeSelectedProduct();
                }
            };
            // </выбор продукта>
    }]);

    module.controller('NewsFeedCtrl', ['$scope', '$state', '$ionicSlideBoxDelegate', 'bankNews', 'stateCache', 'sys', 'WebWorker',
    function($scope, $state, $ionicSlideBoxDelegate, bankNews, stateCache, sys, WebWorker) {
        var NEWS_COUNTER_STEP = 10;

        $scope.advertList = undefined;
        $scope.newsAndPromo = undefined;

        var assignNews = function(result) {
            bankNews.setNews(result.data);
            $scope.advertList = bankNews.getAdvertList();
            $scope.newsAndPromo = bankNews.getNewsAndPromo();
            $ionicSlideBoxDelegate.update();
        };

        var offset = 0;
        var uploading = $scope.isAuthorized;

        if (!$scope.isAuthorized) {
            sys.clearWebViewCookies().then(function(){
                WebWorker.initSslCheck();
                WebWorker.invoke('getNews', 'getNews').then(function(result) {
                    $scope.newsAndPromo = result.data;
                });
            });
        } else if (!bankNews.getNews()) {
            WebWorker.invoke('getNews', 0, 10, 'news,promotion,advert').then(assignNews);
        } else {
            $scope.advertList = bankNews.getAdvertList();
            $scope.newsAndPromo = bankNews.getNewsAndPromo();
        }

        $scope.isNew = function(news) {
            if ($scope.isAuthorized) {
                if ($state.current.lastVisit) {
                    var docDate = Date.parse(news.documentDate);
                    return isNaN(docDate) ? false : new Date(docDate).getTime() > $state.current.lastVisit.getTime();
                }
                return true;
            }
            return false;
        };

        $scope.showDetails = function(news) {
            if ($scope.isAuthorized) {
                $state.go('news.details', {newsId:news.id, news: news});
            } else {
                $state.go('unauth_news.details', {newsId:news.id, news: news});
            }
        };

        $scope.showMoreNews = function() {
            if (uploading) {
                offset += NEWS_COUNTER_STEP;
                return WebWorker.invoke('getNews', offset, NEWS_COUNTER_STEP, 'news,promotion').then(function(result) {
                    if (result.data.length == 0) {
                        uploading = false;
                        return;
                    }
                    bankNews.addNews(result.data);
                    $scope.advertList = bankNews.getAdvertList();
                    $scope.newsAndPromo = bankNews.getNewsAndPromo();
                });
            }
        };

        $scope.readAll = function() {
            stateCache.updateLastVisit($state.current.name);
            $state.current.lastVisit = stateCache.getLastVisit($state.current.name);
            $scope.$applyAsync();
        };
    }]);

    module.controller('NewsItemCtrl', ['$scope', '$stateParams', function($scope, $stateParams) {
        $scope.news = $stateParams.news;
    }]);

    module.controller('NoticeCtrl', ['$scope', 'WebWorker', '$ionicScrollDelegate', function($scope, WebWorker, $ionicScrollDelegate) {
        var NOTICE_COUNTER_STEP = 5,
            offset = 0;

        $scope.noticeList = [];

        /**
         * Установить уведомление прочитанным
         * @param notice    уведомление
         */
        $scope.setAsReadNotice = function(notice) {
            notice.isRead = true;
            WebWorker.postMessage('invokeUserEntityMethod', 'setAsReadNotice', ['setAsReadNotice', notice.id]);
        };

        $scope.showMore = function() {
            $scope.showSpinner = true;
            WebWorker.invoke('getNoticeList', [offset, NOTICE_COUNTER_STEP]).then(function(result) {
                $scope.showSpinner = false;
                $scope.hasNext = result.data.hasNext;
                $scope.noticeList = $scope.noticeList.concat(result.data.noticeList);
                $ionicScrollDelegate.resize();
            });
            offset += NOTICE_COUNTER_STEP;
        };

        $scope.showMore();
    }]);

    module.controller('BonusNewsCtrl', ['$scope', 'bankNews', function($scope, bankNews) {
        this.news = bankNews.getNewsAndPromo();
    }]);

    module.controller('CurrencyRatesCtrl', ['$scope', 'WebWorker', 'curRates', 'sys', function($scope, WebWorker, curRates, sys) {
        var controller = this;
        controller.now = new Date();

        var getCurrentRates = function(){
            delete controller.rates;
            WebWorker.invoke('getCurrentRates').then(function(result){
                controller.rates = curRates.adjustRates(result.data || []);
            });
        };

        if ($scope.isAuthorized) {
            getCurrentRates();
        } else {
            /* в неавторизованной зоне на всякий случай очистим куки (иногда вылетает ошибка) */
            sys.clearWebViewCookies().then(function() {
                WebWorker.initSslCheck();
                getCurrentRates();
            });
        }

        var getCurrencyRateHistory = function(period){
            delete controller.rateHistory;
            WebWorker.invoke('getCurrencyRateHistory', period).then(function(result){
                controller.rateHistory = result.data || null;
            });
        };

        controller.getHistory = function(period) {
            if ($scope.isAuthorized) {
                getCurrencyRateHistory(period);
            } else {
                /* в неавторизованной зоне на всякий случай очистим куки (иногда вылетает ошибка) */
                sys.clearWebViewCookies().then(function(){
                    getCurrencyRateHistory(period);
                });
            }
        };
    }]);

    module.controller('ConfirmationCtrl', ['$scope', '$state', '$interval', '$window', 'sys', 'persistence', 'commonSrv', 'WebWorker',
        function($scope, $state, $interval, $window, sys, persistence, commonSrv, WebWorker) {

            /**
             * Кнопка "Отправить повторно" (генерация и отправка в смс)
             */
            $scope.generate = function() {
                switch($scope.params.actionStrId) {
                    case 'auth-meth-name-and-pswd':
                    case 'auth-meth-restore-access':
                        WebWorker.invoke('generateOneTimePasswordForAuth');
                        break;
                    case 'RetailConfirmChangeMobileNumber':
                        WebWorker.invoke('invokeUserEntityMethod', 'generateOneTimePassword', $scope.params.actionStrId, $scope.params.newMobileTelephone);
                        break;
                    default:
                        WebWorker.invoke('invokeUserEntityMethod', 'generateOneTimePassword', $scope.params.actionStrId);
                        break;
                }
                $scope.seconds = 30;
                $interval(function() {$scope.seconds--;}, 1000, 30, true);
        };

        var positionInput = 0;
        $('.confirmation-date').bind('cut copy paste', function (e) {
            e.preventDefault(); //disable cut,copy,paste
        });

        var smsCodeLength = function() {
            if (angular.isUndefined($scope.smsCodeLength)) {
                if ($scope.globals && $scope.globals.smsCodeLength) {
                    $scope.smsCodeLength = $scope.globals.smsCodeLength;
                } else {
                    $scope.smsCodeLength = 4;       // пока на всякий случай сделано 4, хотя проблема вроде решена
                }
            }
            return $scope.smsCodeLength;
        };

        var checkLength = function() {
            if ($scope.params.sms) {
                if ($scope.params.confirmationCode.length === smsCodeLength()) {
                    return false;
                }
            } else if ($scope.params.confirmationCode.length === 8) {
                return false;
            }
            return true;
        };

        /**
         * Кнопка "Подтвердить" (отправка смс-пароля или кодовой даты для проверки + параметры операции для выполнения самой операции)
         */
        $scope.confirm = function() {
            if (!$scope.params.confirmationCode || $scope.params.confirmationCode == '') {
                alert($scope.params.sms ? 'Введите код из SMS' : 'Введите кодовую дату', 'Подтверждение операции');
                return;
            }
            $scope.params.args[0] = $scope.params.confirmationCode;
            positionInput = 0;
            WebWorker.postMessage($scope.params.method, $scope.params.method, $scope.params.args);
        };

        $scope.hasHint = function() {
            if (($scope.params && $scope.params.codeDateHint) || ($scope.retailClient && $scope.retailClient.codeDateHint)) {
                return true;
            }
            return false;
        };

        /**
             * Кнопка "Показать подсказку" ios
             */
            $scope.showHint = function() {
                alert($scope.params.codeDateHint || $scope.retailClient.codeDateHint, 'Подсказка');
            };

            /**
         * Кнопка "Показать подсказку" android
         */
        $scope.showHintAndroid = function() {
            $scope.params.codeDateHint = $scope.params.codeDateHint || $scope.retailClient.codeDateHint;
            $scope.hintIsShown = true;
        };

        /**
         * Кнопка "OK" android
         */
        $scope.hideHint = function() {
            $scope.hintIsShown = false;
        };

        /**
         * При отмене подтверждения заявки на ВПК и перевыпуск карты в шину требуется отправить запрос
         */
        var rollbackVirtCardAndReissueCardRequest = function() {
            if ($scope.params.method == 'sendRetailVirtCardRequest' || $scope.params.method == 'sendRetailBankCardReissueRequest') {
                $scope.params.args[0] = 'ROLLBACK';
                WebWorker.postMessage($scope.params.method, $scope.params.method, $scope.params.args);
            }
        };

        /**
         * Кнопка "Х"
         */
        $scope.cancel = function() {
            rollbackVirtCardAndReissueCardRequest();
            $scope.confirmationHide();
        };

        $scope.$on('modal.hidden', function(evt, modal) {
            if (modal == $scope.confirmPanel) {
                $scope.confirmationHide();
            }
        });
    }]);

    module.controller('SendEmailCtrl', ['$scope', '$state', 'commonSrv', 'productSrv', 'WebWorker',
        function($scope, $state, commonSrv, productSrv, WebWorker) {

        $scope.currentProduct = productSrv.getCurrentProduct();
        $scope.sendEmailData = { email: $scope.retailClient.email };
        $scope.formType = $state.params.formType;

        function processingResults(data) {
                switch (data.cmdInfo) {
                    case 'sendEmail':
                        var message = '';
                        if ($scope.formType == 'REPLENISHMENT') {
                            message = 'Реквизиты будут отправлены на ';
                        } else if ($scope.formType == 'SCHEDULE') {
                            message = 'График платежей будет отправлен на ';
                        }
                        alert(message + $scope.sendEmailData.email + '.\nОтправка обычно занимает не более 5 минут.');
                        break;
                }
                $scope.$apply();
        }
        WebWorker.setFunction(processingResults);

            $scope.sendEmail = function(email) {
                if (email) {
                    WebWorker.postMessage('sendEmail', 'sendEmail', [$scope.currentProduct, email, $scope.formType]);
                } else {
                    alert('Введите адрес');
                }
            }
        }]);

    module.controller('HowToConnectCtrl', ['$scope', function($scope) {

    }]);

}(window.AppConfig || {}));