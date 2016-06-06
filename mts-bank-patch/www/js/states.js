/**
 * Регистрация состояний для всех платформ
 */
(function () {
    var module = angular.module('app');

    module.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {

        $urlRouterProvider.otherwise(function($injector, $location) {
            var persistence = $injector.get('persistence');
            if (persistence) {
                var authMode = persistence.get('authMode');
                if (authMode == 'shortCode' || authMode == 'touchID') {
                    return '/login/shortCode';
                }
            }
            return '/start';
        });

        $stateProvider.state('start', {
            url: '/start',
            views: {
                'rootpane': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('main.html'); }]
                }
            },
            onEnter: function($rootScope) {
                $rootScope.showStatusBar(false);
            },
            onExit: function($rootScope) {
                $rootScope.showStatusBar(true);
            }
        });

        $urlRouterProvider.when('/login', '/login/password');
        $stateProvider.state('login', {
            abstract: true,
            params: {
                isExit: false
            },
            url: '/login',
            views: {
                'rootpane': {
                    controller: 'LoginCtrl',
                    template: '<ui-view/>'
                }
            }
        });

        $stateProvider.state('login.shortCode', {
            url: '/shortCode',
            templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('auth/shortCode.html'); }],
            onEnter: function($rootScope) {
                $rootScope.showStatusBar(false);
            },
            onExit: function($rootScope) {
                $rootScope.showStatusBar(true);
            }
        });

        $stateProvider.state('login.password', {
            url: '/password',
            templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('auth/login.html'); }]
        });

        $stateProvider.state('login.restoreAccess', {
            url: '/restoreAccess',
            templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('auth/restoreAccess.html'); }]
        });

        $stateProvider.state('login.restoreAccessCard', {
            url: '/restoreAccessCard',
            templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('auth/restoreAccessCard.html'); }],
            onEnter: function($injector) {
                var sys = $injector.get('sys');
                if (sys.getPlatform() == 'ios' && window.Keyboard) {
                    window.Keyboard.hideFormAccessoryBar(true);
                }
            },
            onExit: function($injector) {
                var sys = $injector.get('sys');
                if (sys.getPlatform() == 'ios' && window.Keyboard) {
                    window.Keyboard.hideFormAccessoryBar(false);
                }
            }
        });

        $stateProvider.state('login.restoreAccessAccount', {
            url: '/restoreAccessAccount',
            templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('auth/restoreAccessAccount.html'); }],
            onEnter: function($injector) {
                var sys = $injector.get('sys');
                if (sys.getPlatform() == 'ios' && window.Keyboard) {
                    window.Keyboard.hideFormAccessoryBar(true);
                }
            },
            onExit: function($injector) {
                var sys = $injector.get('sys');
                if (sys.getPlatform() == 'ios' && window.Keyboard) {
                    window.Keyboard.hideFormAccessoryBar(false);
                }
            }
        });

        $stateProvider.state('login.restoreAccessPassport', {
            url: '/restoreAccessPassport',
            templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('auth/restoreAccessPassport.html'); }],
            onEnter: function($injector) {
                var sys = $injector.get('sys');
                if (sys.getPlatform() == 'ios' && window.Keyboard) {
                    window.Keyboard.hideFormAccessoryBar(true);
                }
            },
            onExit: function($injector) {
                var sys = $injector.get('sys');
                if (sys.getPlatform() == 'ios' && window.Keyboard) {
                    window.Keyboard.hideFormAccessoryBar(false);
                }
            }
        });

        $stateProvider.state('login.createLoginPassword', {
            url: '/createLoginPassword',
            templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('auth/createLoginPassword.html'); }]
        });

        $stateProvider.state('login.changeLoginPassword', {
            url: '/changeLoginPassword',
            templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('auth/changeLoginPassword.html'); }]
        });

        $stateProvider.state('home', {
            url: '/home',
            views: {
                'rootpane': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('home.html'); }]
                }
            }
        });

        /* Провал в детальную инфу операции с Главной страницы */
        $stateProvider.state('homeoperation', {
            url: '/homeoperation',
            views: {
                'rootpane': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('extract/operation.html'); }]
                }
            }
        });

        $stateProvider.state('sendtoemailreceipt', {
            url: '/sendtoemailreceipt',
            params: {operation: {}},
            views: {
                'rootpane': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('send.to.email.receipt.html'); }]
                }
            }
        });

        $stateProvider.state('myfinances', {
            url: '/myfinances',
            views: {
                'rootpane': {
                    templateProvider: ['$rootScope', 'sys', function($rootScope, sys) {
                        if ($rootScope.adaptToWindowsphone) {
                            return sys.getTplByPlatform('myfinances-page.html', 'windows');
                        }
                        return sys.getTplByPlatform('myfinances-page.html');
                    }]
                }
            }
        });

        $stateProvider.state('products', {
            url: '/products',
            views: {
                'rootpane': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('products.html'); }]
                }
            }
        });

        $stateProvider.state('products.embassydoc', {
            url: '/embassydoc',
            views: {
                'products-page': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('embassydoc.html'); }]
                }
            }
        });

        $stateProvider.state('accountopenreq', {
            url: '/accountopenreq',
            params: {
                retailDoc: null,
                fromTransfer: false
            },
            views: {
                'rootpane': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('request/accountopenreq.html'); }]
                }
            }
        });

        $stateProvider.state('issuevirtualcard', {
            url: '/issuevirtualcard',
            params: {
                retailDoc: null
            },
            views: {
                'rootpane': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('request/issue.virtual.card.html'); }]
                }
            }
        });

        $stateProvider.state('depositselect', {
            url: '/depositselect',
            views: {
                'rootpane': {
                    templateUrl: 'templates/deposit/deposit.new.html'
                }
            }
        });

        $stateProvider.state('depositselect.depositparams', {
            url: '/params',
            views: {
                'select-deposit-view': {
                    templateUrl: 'templates/deposit/deposit.params.html'
                }
            }
        });

        $stateProvider.state('depositselect.depositcompare', {
            url: '/compare',
            views: {
                'select-deposit-view': {
                    templateUrl: 'templates/deposit/deposit.compare.html'
                }
            }
        });

        $stateProvider.state('depositselect.depositcompareparams', {
            url: '/compareparams',
            params: {},
            views: {
                'select-deposit-view': {
                    templateUrl: 'templates/deposit/deposit.compare.params.html'
                }
            }
        });

        $stateProvider.state('cards', {
            url: '/cards',
            views: {
                'rootpane': {
                    templateUrl: 'templates/cards.html',
                    controller:  function() {
                        $('#page').removeClass('none');
                    }
                }
            }
        });

        $stateProvider.state('selectcodifiers', {
            url: '/selectcodifiers',
            views: {
                'rootpane': {
                    templateProvider: ['sys', function (sys) {
                        return sys.getTplByPlatform('codifiers.html');
                    }]
                }
            }

        });

        // Карты
        $stateProvider.state('card', {
            url: '/card/:cardId',
            views: {
                'rootpane': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('card/card.html'); }],
                    controller: 'CardCtrl as CardCtrl'
                }
            }
        });

        $stateProvider.state('autopaylist', {
            url: '/autopaylist',
            params: { bankCard: null },
            views: {
                'rootpane': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('card/auto.pay.list.html'); }]
                }
            }
        });

        $stateProvider.state('autopay', {
            url: '/autopay',
            params: {
                bankCard: null,
                description: null,

                optionId: null,
                phone: null,
                sum: null,
                threshold: null
            },
            views: {
                'rootpane': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('card/auto.pay.html'); }]
                }
            }
        });

        $stateProvider.state('card.blockedoperations', {
            url: '/blockedoperations',
            views: {
                'card-page': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('card/blocked.operations.html'); }]
                }
            }
        });

        // Экран задолженность
        $stateProvider.state('card.debtinfo', {
            url: '/debtinfo',
            views: {
                'card-page': {
                    templateUrl: 'templates/ios/card/debtinfo.html'
                }
            }
        });

        $stateProvider.state('card.info', {
            url: '/info',
            views: {
                'card-page': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('card/info.html'); }]
                }
            }
        });

        $stateProvider.state('card.extract', {
            url: '/extract',
            views: {
                'card-page': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('extract/extract.html'); }]
                }
            }
        });

        $stateProvider.state('card.sendextract', {
            url: '/sendextract',
            params: { dates: {value: {}} },
            views: {
                'card-page': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('extract/send.extract.html'); }]
                }
            }
        });

        $stateProvider.state('card.extract.statistic', {
            url: '/statistic',
            views: {
                'extract-page': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('extract/statistic.html'); }]
                }
            }
        });

        $stateProvider.state('card.extract.category', {
            url: '/category',
            views: {
                'extract-page': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('extract/category.html'); }]
                }
            }
        });

        $stateProvider.state('card.operation', {
            url: '/operation',
            views: {
                'card-page': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('extract/operation.html'); }]
                }
            }
        });

        $stateProvider.state('card.extract.operation', {
            url: '/operation',
            views: {
                'extract-page': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('extract/operation.html'); }]
                }
            }
        });

        $stateProvider.state('card.services', {
            url: '/services',
            views: {
                'card-page': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('card/services.html'); }]
                }
            }
        });

        $stateProvider.state('card.requisites', {
            url: '/requisites',
            views: {
                'card-page': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('card/requisites.html'); }]
                }
            }
        });

        $stateProvider.state('card.bonuses', {
            url: '/bonuses',
            views: {
                'card-page': {
                    templateUrl: 'templates/ios/card/bonuses.html'
                }
            }
        });

        $stateProvider.state('card.bonusextract', {
            url: '/bonusextract',
            params: {bonus: {}},
            views: {
                'card-page': {
                    templateUrl: 'templates/ios/card/bonuses.extract.html',
                    controller: 'CardExtractBonusesCtrl as CardExtractBonusesCtrl'
                }
            }
        });

        $stateProvider.state('card.bonusextract.filter', {
            url: '/filter',
            views: {
                'bonus-extract-header': {
                    template: '<rs-header lbtn-class="icon-close" lbtn-action="goBack()" rbtn-class="{{bonusExtractHeaderBtns.rbtn}}" rbtn-action="rbtnAction()">Фильтр</rs-header>',
                    controller: ['$scope', function($scope) {
                        $scope.$parent.bonusExtractHeaderBtns = {rbtn: 'icon-check-mark'};
                        $scope.rbtnAction = function(){ $scope.$parent.$broadcast('bonusExtractRightBtnClick'); };
                    }]
                },
                'bonus-extract-content': {
                    templateUrl: 'templates/ios/card/bonuses.extract.filter.html',
                    controller: 'CardExtractBonusesFilterCtrl as CardExtractBonusesFilterCtrl'
                }
            }
        });

        $stateProvider.state('card.bonusextract.operation', {
            url: '/operation',
            views: {
                'bonus-extract-content': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('extract/operation.html'); }]
                }
            }
        });

        $stateProvider.state('card.sendEmail', {
            url: '/sendemail',
            params: {formType: {}},
            views: {
                'card-page': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('sendemail.html'); }]
                }
            }
        });

        $stateProvider.state('card.reissue', {
            url: '/reissue',
            views: {
                'card-page': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('card/reissue.html'); }]
                }
            }
        });

        $stateProvider.state('card.connectoption', {
            url: '/connectoption',
            params: {
                option: {},
                hasBonusProgram: false
            },
            views: {
                'card-page': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('card/connect.option.html'); }]
                }
            }
        });

        $stateProvider.state('card.insurance', {
            url: '/cardinsurance',
            views: {
                'card-page': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('card/insurance.html'); }]
                }
            }
        });

        $stateProvider.state('card.smsbankinfo', {
            url: '/smsbankinfo/:hasBonusProgram',
            views: {
                'card-page': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('smsbankinfo.html'); }]
                }
            }
        });

        $stateProvider.state('card.embassydoc', {
            url: '/embassydoc',
            views: {
                'card-page': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('embassydoc.html'); }]
                }
            }
        });

        // Счета
        $stateProvider.state('account', {
            url: '/account/:productId',
            views: {
                'rootpane': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('account/account.html'); }],
                    controller: 'AccountCtrl as AccountCtrl'
                }
            }
        });

        $stateProvider.state('account.info', {
            url: '/info',
            views: {
                'account-page': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('account/info.html'); }]
                }
            }
        });

        $stateProvider.state('account.extract', {
            url: '/extract',
            views: {
                'account-page': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('extract/extract.html'); }]
                }
            }
        });

        $stateProvider.state('account.sendextract', {
            url: '/sendextract',
            params: { dates: {value: {}} },
            views: {
                'account-page': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('extract/send.extract.html'); }]
                }
            }
        });

        $stateProvider.state('account.extract.statistic', {
            url: '/statistic',
            views: {
                'extract-page': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('extract/statistic.html'); }]
                }
            }
        });

        $stateProvider.state('account.extract.category', {
            url: '/category',
            views: {
                'extract-page': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('extract/category.html'); }]
                }
            }
        });

        $stateProvider.state('account.operation', {
            url: '/operation',
            views: {
                'account-page': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('extract/operation.html'); }]
                }
            }
        });

        $stateProvider.state('account.extract.operation', {
            url: '/operation',
            views: {
                'extract-page': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('extract/operation.html'); }]
                }
            }
        });

        $stateProvider.state('account.requisites', {
            url: '/requisites',
            views: {
                'account-page': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('account/requisites.html'); }]
                }
            }
        });

        $stateProvider.state('account.sendEmail', {
            url: '/sendemail',
            params: {formType: {}},
            views: {
                'account-page': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('sendemail.html'); }]
                }
            }
        });

        $stateProvider.state('account.services', {
            url: '/services',
            views: {
                'account-page': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('account/services.html'); }]
                }
            }
        });

        $stateProvider.state('account.close', {
            url: '/close',
            views: {
                'account-page': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('request/product.close.html'); }]
                }
            }
        });

        $stateProvider.state('account.smsbankinfo', {
            url: '/smsbankinfo',
            views: {
                'account-page': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('smsbankinfo.html'); }]
                }
            }
        });

        $stateProvider.state('account.embassydoc', {
            url: '/embassydoc',
            views: {
                'account-page': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('embassydoc.html'); }]
                }
            }
        });

        $stateProvider.state('account.rateinfo', {
            url: '/rateinfo',
            views: {
                'account-page': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('account/rateinfo.html'); }]
                }
            }
        });

        $stateProvider.state('newdeposit', {
            url: '/new/:params',
            views: {
                'rootpane': {
                    templateUrl: 'templates/deposit/deposit.new.html'
                }
            }
        });

        $stateProvider.state('depositselect.depositdetails', {
            url: '/:selectDepositId',
            params: { deposit: {}, selectDepositId: 0 },
            views: {
                'select-deposit-view': {
                    templateUrl: 'templates/deposit/deposit.details.html'
                }
            }
        });

        $stateProvider.state('depositselect.depositdetails.depositopen', {
            url: '/depositopen',
            views: {
                'open-deposit-view': {
                    templateUrl: 'templates/deposit/deposit.open.html'
                }
            }
        });

        /* просмотр заявки на открытие вклада */
        $stateProvider.state('depositopen', {
            url: '/depositopen',
            params: {
                retailDoc: null
            },
            views: {
                'rootpane': {
                    templateUrl: 'templates/deposit/deposit.open.html'
                }
            }
        });

        $stateProvider.state('deposit.close', {
            url: '/close',
            views: {
                'deposit-page': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('request/product.close.html'); }]
                }
            }
        });

        $stateProvider.state('loan', {
            url: '/loan/:loanId',
            views: {
                'rootpane': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('loan/loan.html'); }]
                }
            }
        });

        $stateProvider.state('loan.extract', {
            url: '/extract',
            views: {
                'loan-page': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('extract/extract.html'); }]
                }
            }
        });

        $stateProvider.state('loan.sendextract', {
            url: '/sendextract',
            params: { dates: {value: {}} },
            views: {
                'loan-page': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('extract/send.extract.html'); }]
                }
            }
        });

        $stateProvider.state('loan.extract.statistic', {
            url: '/statistic',
            views: {
                'extract-page': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('extract/statistic.html'); }]
                }
            }
        });

        $stateProvider.state('loan.extract.category', {
            url: '/category',
            views: {
                'extract-page': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('extract/category.html'); }]
                }
            }
        });

        $stateProvider.state('loan.operation', {
            url: '/operation',
            views: {
                'loan-page': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('extract/operation.html'); }]
                }
            }
        });

        $stateProvider.state('loan.extract.operation', {
            url: '/operation',
            views: {
                'extract-page': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('extract/operation.html'); }]
                }
            }
        });

        // Информация по кредиту
        $stateProvider.state('loan.info', {
            url: '/info',
            views: {
                'loan-page': {
                    templateUrl: 'templates/ios/loan/info.html'
                }
            }
        });

        // Экран задолженность
        $stateProvider.state('loan.debtinfo', {
            url: '/debtinfo',
            views: {
                'loan-page': {
                    templateUrl: 'templates/ios/loan/debtinfo.html'
                }
            }
        });

        $stateProvider.state('loan.howtopay', {
            url: '/howtopay',
            views: {
                'loan-page': {
                    templateUrl: 'templates/loan.howtopay.html'
                }
            }
        });

        $stateProvider.state('loan.finances', {
            url: '/finances',
            views: {
                'tab-content': {
                    templateUrl: 'templates/loan.finances.html'
                }
            }
        });

        $stateProvider.state('loan.requisites', {
            url: '/requisites',
            views: {
                'loan-page': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('loan/requisites.html'); }]
                }
            }
        });

        $stateProvider.state('loan.sendEmail', {
            url: '/sendemail',
            params: {formType: {}},
            views: {
                'loan-page': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('sendemail.html'); }]
                }
            }
        });

        $stateProvider.state('loan.fulldebt', {
            url: '/fulldebt',
            views: {
                'loan-page': {
                    templateUrl: 'templates/loan.fulldebt.html'
                }
            }
        });

        $stateProvider.state('loan.newpayment', {
            url: '/newpayment',
            views: {
                'loan-page': {
                    templateUrl: 'templates/loan.newpayment.html'
                }
            }
        });

        $stateProvider.state('loan.schedule', {
            url: '/schedule',
            views: {
                'loan-page': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('loan/schedule.html'); }]
                }
            }
        });

        $stateProvider.state('loan.payment', {
            url: '/payment/{paymentId:[0-9]+}',
            params: {payment: {}, loan:{}},
            views: {
                'loan-page': {
                    templateUrl: 'templates/loan.paymentinfo.html'
                }
            }
        });

        $urlRouterProvider.when('/bonuses', '/bonuses/main');
        $stateProvider.state('bonuses', {
            url: '/bonuses',
            views: {
                'rootpane': {
                    templateUrl: 'templates/bonuses.html'
                }
            }
        });

        $stateProvider.state('bonuses.main', {
            url: '/main',
            views: {
                'bonuses-content': {
                    templateUrl: 'templates/bonuses.main.html',
                    controller: 'BonusesCtrl as BonusesCtrl'
                }
            }
        });

        $stateProvider.state('bonusdetails', {
            url: '/bonusdetails',
            params: {
                bonus: {},
                isInterestingBonuses: false
            },
            views: {
                'rootpane': {
                    templateUrl: 'templates/bonuses.details.html',
                    controller: 'BonusesDetailsCtrl as BonusesDetailsCtrl'
                }
            }
        });

        $stateProvider.state('addoption', {
            url: '/addoption',
            params: {
                bonus: {},
                product: {value: null},
                isDeactivate: false
            },
            views: {
                'rootpane': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('add.option.html'); }]
                }
            }
        });

        $stateProvider.state('bonuses.partners', {
            url: '/partners',
            views: {
                'bonuses-content': {
                    templateUrl: 'templates/bonuses.partners.html',
                    controller: 'BonusesPartnersCtrl as BonusesPartnersCtrl'
                }
            }
        });

        $stateProvider.state('partnerdetails', {
            url: '/partnerdetails',
            params: { bankPartner: {} },
            views: {
                'rootpane': {
                    templateUrl: 'templates/bonuses.partner.details.html',
                    controller: 'PartnerDetailsCtrl as PartnerDetailsCtrl'
                }
            }
        });

        $stateProvider.state('bonuses.promos', {
            url: '/promos',
            views: {
                'bonuses-content': {
                    templateUrl: 'templates/bonuses.promos.html',
                    controller: 'BonusesPromosCtrl as BonusesPromosCtrl'
                }
            }
        });

        $stateProvider.state('promodetails', {
            url: '/promodetails',
            params: { promo: {} },
            views: {
                'rootpane': {
                    templateUrl: 'templates/bonuses.promo.details.html',
                    controller: 'PromoDetailsCtrl as PromoDetailsCtrl'
                }
            }
        });

        $stateProvider.state('bonusnews', {
            url: '/bonusnews',
            views: {
                'rootpane': {
                    templateUrl: 'templates/bonuses.news.html',
                    controller: [function() {
                        $('#page').removeClass('none');
                    }]
                }
            }
        });

        $stateProvider.state('bonusnews.item', {
            url: '/{bniId:[0-9]+}',
            views: {
                'bonusnews-page': {
                    templateUrl: 'templates/bonuses.news.item.html'
                }
            }
        });

        $stateProvider.state('payments', {
            url: '/payments',
            views: {
                'rootpane': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('payments/payments.html'); }]
                }
            }
        });

        $stateProvider.state('payments.paymentssettings', {
            url: '/paymentssettings',
            views: {
                'payment-page': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('payments/settings.html'); }]
                }
            }
        });

        $stateProvider.state('operationhistory', {
            url: '/operationhistory',
            views: {
                'rootpane': {
                    templateUrl: 'templates/ios/payments/operation.history.html'
                }
            }
        });

        $stateProvider.state('operationhistory.filter', {
            url: '/operationhistoryfilter',
            views: {
                'operation-history-view': {
                    templateUrl: 'templates/ios/payments/operation.history.filter.html'
                }
            }
        });

        $stateProvider.state('operationhistory.operation', {
            url: '/operation',
            views: {
                'operation-history-view': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('extract/operation.html'); }]
                }
            }
        });

        $stateProvider.state('paycategories', {
            url: '/paycategories',
            params: {
                title: 'Список категорий',
                categories: {array: true}
            },
            views: {
                'rootpane': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('payments/categories.html'); }]
                }
            }
        });

        $stateProvider.state('paymentaccruals', {
            url: '/paymentaccruals',
            views: {
                'rootpane': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('payments/payment.accruals.html'); }]
                }
            }
        });

        $stateProvider.state('mgtspaymentlist', {
            url: '/mgtspaymentlist',
            views: {
                'rootpane': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('payments/mgts.payment.list.html'); }]
                }
            }
        });

        $stateProvider.state('rubpayment', {
            url: '/rubpayment',
            params : {
                title: 'Платеж',
                viewMode: 'EDIT',
                typePayment: {},
                isTaxPayment: false,
                payeeType: {},
                payeeId: null,
                userDebtId: null,
                favorite: null,
                template: null
            },
            views: {
                'rootpane': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('payments/rub.payment.html'); }]
                }
            }
        });

        $stateProvider.state('servicepay', {
            url: '/servicepay',
            params : {
                tile: {},
                title: 'Платеж',
                viewMode: 'EDIT',
                providerId: null,
                serviceId: null,
                favorite: null,
                template: null,
                personalAccountId: null
            },
            views: {
                'rootpane': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('payments/service.pay.html'); }]
                }
            }
        });

        $stateProvider.state('payments.categories.category', {
            url: '/category',
            params: {
                category: {}
            },
            views: {
                'payment-page': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('payments/category.html'); }]
                }
            }
        });

        $stateProvider.state('transfer', {
            url: '/transfer',
            params : {
                title: 'Перевод',
                viewMode: 'EDIT',
                favorite: null,
                template: null,
                paymentParams: null
            },
            views: {
                'rootpane': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('payments/transfer.html'); }]
                }
            }
        });

        $stateProvider.state('ictransfer', {
            url: '/ictransfer',
            params : {
                title: 'Другому клиенту банка',
                viewMode: 'EDIT',
                favorite: null,
                template: null
            },
            views: {
                'rootpane': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('payments/ic.transfer.html'); }]
                }
            }
        });

        $stateProvider.state('paymenttocard', {
            url: '/paymenttocard',
            params : {
                title: 'С карты на карту',
                viewMode: 'EDIT',
                favorite: null,
                template: null
            },
            views: {
                'rootpane': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('payments/payment.to.card.html'); }]
                }
            }
        });

        $stateProvider.state('paymenttofriend', {
            url: '/paymenttofriend',
            params : {
                title: 'Друзьям',
                viewMode: 'EDIT',
                favorite: null,
                template: null,
                friendExtId: null
            },
            views: {
                'rootpane': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('payments/tr.to.friend.html'); }]
                }
            }
        });

        $stateProvider.state('socialfriends', {
            url: '/socialfriends',
            views: {
                'rootpane': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('payments/social.friends.html'); }]
                }
            }
        });

        $stateProvider.state('favourites', {
            url: '/favourites',
            views: {
                'rootpane': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('payments/favourites.html'); }]
                }
            }
        });

        /* Неавторизованные новости */
        $stateProvider.state('unauth_news', {
            url: '/unauth_news',
            views: {
                'rootpane': {
                    templateUrl: 'templates/news/news.html',
                    controller: 'NewsFeedCtrl as NewsFeedCtrl'
                }
            }
        });

        $stateProvider.state('unauth_news.details', {
            url: '/:newsId',
            params: {news: {}},
            views: {
                'news-page': {
                    templateUrl: 'templates/news/news.details.html',
                    controller: 'NewsItemCtrl as NewsItemCtrl'
                }
            }
        });

        $stateProvider.state('news', {
            url: '/news',
            views: {
                'rootpane': {
                    templateUrl: 'templates/news/news.html',
                    controller: 'NewsFeedCtrl as NewsFeedCtrl'
                }
            }
        });

        $stateProvider.state('news.details', {
            url: '/:newsId',
            params: {news: {}},
            views: {
                'news-page': {
                    templateUrl: function(stateParams) {
                        return stateParams.news && stateParams.news.entityKind == 'RetailPromotion'
                            ? 'templates/bonuses.news.item.html'
                            : 'templates/news/news.details.html';
                    },
                    controller: 'NewsItemCtrl as NewsItemCtrl'
                }
            }
        });

        $stateProvider.state('notice', {
            url: '/notice',
            views: {
                'rootpane': {
                    templateUrl: 'templates/news/notice.html',
                    controller: 'NoticeCtrl as NoticeCtrl'
                }
            }
        });

        $stateProvider.state('help', {
            url: '/help',
            views: {
                'rootpane': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('help/help.html'); }]
                }
            }
        });

        $stateProvider.state('onlinecall', {
            url: '/onlinecall',
            views: {
                'rootpane': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('help/onlinecall.html'); }],
                    controller: 'OnlineCallCtrl as OnlineCallCtrl'
                }
            }
        });

        $stateProvider.state('serviceOnlineBank', {
            url: '/serviceOnlineBank',
            views: {
                'rootpane': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('help/serviceOnlineBank.html'); }],
                    controller: 'ServiceOnlineBankCtrl as ServiceOnlineBankCtrl'
                }
            }
        });

        $stateProvider.state('serviceOnlineBank.serviceFilterOnlineBank', {
            url: '/serviceFilterOnlineBank',
            views: {
                'serviceonlinebank-page': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('help/serviceFilterOnlineBank.html'); }]
                }
            }
        });

        $stateProvider.state('serviceOnlineBank.operation', {
            url: '/operation',
            views: {
                'serviceonlinebank-page': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('extract/operation.html'); }]
                }
            }
        });

        $stateProvider.state('onlinechat', {
            url: '/onlinechat',
            views: {
                'rootpane': {
                    templateUrl: 'templates/onlinechat.html',
                    controller: 'ChatCtrl as ChatCtrl'
                }
            },
            onEnter: function() {
                if (window.Keyboard && window.Keyboard.shrinkView) {
                    window.Keyboard.shrinkView(true);
                }
            },
            onExit: function($injector) {
                var sys = $injector.get('sys');
                if (sys.getPlatform() == 'ios' && window.Keyboard && window.Keyboard.shrinkView) {
                    window.Keyboard.shrinkView(false);
                }
            }
        });

        $stateProvider.state('currates', {
            url: '/currates',
            views: {
                'rootpane': {
                    templateUrl: 'templates/currates.html',
                    controller: 'CurrencyRatesCtrl as CurrencyRatesCtrl'
                }
            }
        });

        /* курсы валют в неавторизованной зоне */
        $stateProvider.state('unauth_currates', {
            url: '/unauth_currates',
            views: {
                'rootpane': {
                    templateUrl: 'templates/currates.html',
                    controller: 'CurrencyRatesCtrl as CurrencyRatesCtrl'
                }
            }
        });

        $stateProvider.state('atmsandoffices', {
            url: '/atmsandoffices',
            params: { type: '' },
            views: {
                'rootpane': {
                    templateUrl: 'templates/atmsandoffices.html',
                    controller: 'AtmsAndOfficesCtrl as AtmsAndOfficesCtrl'
                }
            }
        });

        $stateProvider.state('atmsandoffices.object', {
            url: '/object',
            params: {point: {}},
            views: {
                'atmsandoffices-object': {
                    templateUrl: 'templates/atmsandoffices.object.html',
                    controller: 'AtmsAndOfficesPointCtrl as AtmsAndOfficesPointCtrl'
                }
            }
        });

        /* банкоматы в неавторизованной зоне */
        $stateProvider.state('unauth_atmsandoffices', {
            url: '/unauth_atmsandoffices',
            params: { type: '' },
            views: {
                'rootpane': {
                    templateUrl: 'templates/atmsandoffices.html',
                    controller: 'AtmsAndOfficesCtrl as AtmsAndOfficesCtrl'
                }
            }
        });

        $stateProvider.state('unauth_atmsandoffices.object', {
            url: '/unauth_object',
            params: {point: {}},
            views: {
                'atmsandoffices-object': {
                    templateUrl: 'templates/atmsandoffices.object.html',
                    controller: 'AtmsAndOfficesPointCtrl as AtmsAndOfficesPointCtrl'
                }
            }
        });

        $stateProvider.state('tutorscreens', {
            url: '/tutorscreens',
            views: {
                'rootpane': {
                    templateUrl: 'templates/tutorscreens.html',
                    controller: 'TutorScreensCtrl as TutorScreensCtrl'
                }
            }
        });

        $stateProvider.state('tutorscreens.questions', {
            url: '/questions',
            params: {category: {}},
            views: {
                'tutorscreen-content': {
                    templateUrl: 'templates/tutorscreens.questions.html',
                    controller: 'TutorScreensQuestionsCtrl as TutorScreensQuestionsCtrl'
                }
            }
        });

        $stateProvider.state('tutorscreens.questions.answer', {
            url: '/{tsqId:[0-9]+}',
            params: {question: {}},
            views: {
                'tutorscreen-answer-content': {
                    templateUrl: 'templates/tutorscreens.answer.html',
                    controller: ['$scope', '$stateParams', function($scope, $stateParams) {
                        $scope.answerHtml = $stateParams.question.answer;
                    }]
                }
            }
        });

        $stateProvider.state('ideabank', {
            url: '/ideabank',
            views: {
                'rootpane': {
                    templateUrl: 'templates/ideabank.html',
                    controller: 'IdeaBankCtrl as IdeaBankCtrl'
                }
            }
        });

        $stateProvider.state('ideabank.createidea', {
            url: '/createidea',
            views: {
                'ideas-panel-view': {
                    templateUrl: 'templates/ideabank.createidea.html',
                    controller: 'IdeaBankCreateIdeaCtrl as IdeaBankCreateIdeaCtrl'
                }
            }
        });

        $stateProvider.state('controllingcosts', {
            url: '/controllingcosts',
            views: {
                'rootpane': {
                    templateUrl: 'templates/controllingCosts/controllingCosts.html'
                }
            }
        });

        $stateProvider.state('categorybudget', {
            url: '/categorybudget',
            params: {
                monthIdx: 0
            },
            views: {
                'rootpane': {
                    templateUrl: 'templates/controllingCosts/categoryBudget.html'
                }
            }
        });

        /* Провал в детальную инфу операции со страницы настройки бюджета категории */
        $stateProvider.state('categorybudget.operation', {
            url: '/operation',
            views: {
                'category-budget-view': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('extract/operation.html'); }]
                }
            }
        });

        $stateProvider.state('controllingcostsfilter', {
            url: '/controllingcostsfilter',
            params: {
                productList: {}
            },
            views: {
                'rootpane': {
                    templateUrl: 'templates/controllingCosts/controllingCostsFilter.html'
                }
            }
        });

        $stateProvider.state('controllingcostsfilter.resultfilter', {
            url: '/resultfilter',
            views: {
                'controlling-costs-filter-view': {
                    templateUrl: 'templates/controllingCosts/resultFilter.html'
                }
            }
        });

        /* Провал в категорию со страницы фильтра расходов */
        $stateProvider.state('controllingcostsfilter.category', {
            url: '/category',
            views: {
                'controlling-costs-filter-view': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('extract/category.html'); }]
                }
            }
        });

        /* Провал в операцию со страницы категории из фильтра расходов */
        $stateProvider.state('controllingcostsfilter.operation', {
            url: '/operation',
            views: {
                'controlling-costs-filter-view': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('extract/operation.html'); }]
                }
            }
        });

        $stateProvider.state('settingbudget', {
            url: '/settingbudget',
            params: {
                monthIdx: 0,
                costs: {},
                promise: null
            },
            views: {
                'rootpane': {
                    templateUrl: 'templates/controllingCosts/settingBudget.html'
                }
            }
        });

        $stateProvider.state('calendarevents', {
            url: '/calendarevents',
            views: {
                'rootpane': {
                    controller: 'CalendarCtrl',
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('calendar/calendar.html'); }]
                }
            }
        });

        $stateProvider.state('createcalendarevent', {
            url: '/createcalendarevent',
            views: {
                'rootpane': {
                    controller: 'CreateCalendarEventCtrl',
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('calendar/createCalendarEvent.html'); }]
                }
            }
        });

        $stateProvider.state('confirmation', {
            url: '/confirmation/:own,:methodName', // own - otpConfirm / codeDateConfirm; methodName - наименование локального метода действия
            views: {
                'rootpane': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('confirmation.html'); }]
                }
            }
        });

        $stateProvider.state('settings', {
            url: '/settings',
            views: {
                'rootpane': {
                    controller: 'SettingsCtrl',
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('settings/settings.html'); }]
                }
            }
        });

        $stateProvider.state('settings.background', {
            url: '/background',
            views: {
                'settings-view': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('settings/background.html'); }]
                }
            }
        });

        $stateProvider.state('settings.personal', {
            url: '/personal',
            views: {
                'settings-view': {
                    controller: 'SettingsPersonalDataCtrl',
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('settings/personal/personal.html'); }]
                }
            }
        });

        $stateProvider.state('settings.personal.address', {
            url: '/address',
            views: {
                'settings-personal-data-view': {
                    controller: 'SettingsAddressCtrl',
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('settings/personal/address/address.html'); }]
                }
            }
        });

        $stateProvider.state('settings.personal.address.selectElement', {
            url: '/selectElement',
            views: {
                'settings-address-view': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('settings/personal/address/selectElement.html'); }]
                }
            }
        });

        $stateProvider.state('settings.personal.address.selectRegion', {
            url: '/selectRegion',
            views: {
                'settings-address-view': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('settings/personal/address/selectRegion.html'); }]
                }
            }
        });

        $stateProvider.state('settings.personal.address.selectArea', {
            url: '/selectArea',
            views: {
                'settings-address-view': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('settings/personal/address/selectArea.html'); }]
                }
            }
        });

        $stateProvider.state('settings.personal.address.selectCity', {
            url: '/selectCity',
            views: {
                'settings-address-view': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('settings/personal/address/selectCity.html'); }]
                }
            }
        });

        $stateProvider.state('settings.personal.address.selectLocality', {
            url: '/selectLocality',
            views: {
                'settings-address-view': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('settings/personal/address/selectLocality.html'); }]
                }
            }
        });

        $stateProvider.state('settings.personal.address.selectStreet', {
            url: '/selectStreet',
            views: {
                'settings-address-view': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('settings/personal/address/selectStreet.html'); }]
                }
            }
        });

        $stateProvider.state('settings.personal.email', {
            url: '/email',
            views: {
                'settings-personal-data-view': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('settings/personal/email.html'); }]
                }
            }
        });

        $stateProvider.state('settings.personal.mobileTelephone', {
            url: '/mobileTelephone',
            views: {
                'settings-personal-data-view': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('settings/personal/mobileTelephone.html'); }]
                }
            }
        });

        $stateProvider.state('settings.personal.homeTelephone', {
            url: '/homeTelephone',
            views: {
                'settings-personal-data-view': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('settings/personal/homeTelephone.html'); }]
                }
            }
        });

        $stateProvider.state('settings.personal.insuranceNumber', {
            url: '/insuranceNumber',
            views: {
                'settings-personal-data-view': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('settings/personal/insuranceNumber.html'); }]
                }
            }
        });

        $stateProvider.state('settings.personal.inn', {
            url: '/inn',
            views: {
                'settings-personal-data-view': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('settings/personal/inn.html'); }]
                }
            }
        });

        $stateProvider.state('settings.personal.insurancePass', {
            url: '/insurancePass',
            views: {
                'settings-personal-data-view': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('settings/personal/insurancePass.html'); }]
                }
            }
        });

        $stateProvider.state('settings.personal.driverDoc', {
            url: '/driverDoc',
            views: {
                'settings-personal-data-view': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('settings/personal/driverDoc.html'); }]
                }
            }
        });

        $stateProvider.state('settings.personal.transportPass', {
            url: '/transportPass',
            views: {
                'settings-personal-data-view': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('settings/personal/transportPass.html'); }]
                }
            }
        });

        $stateProvider.state('settings.personal.createDriverOrTransport', {
            url: '/createDriverOrTransport',
            views: {
                'settings-personal-data-view': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('settings/personal/createDriverOrTransport.html'); }]
                }
            }
        });

        $stateProvider.state('settings.personal.nearestOffice', {
            url: '/nearestoffice',
            params: {point: {}},
            views: {
                'settings-personal-data-view': {
                    controller: 'NearestOfficeCtrl',
                    templateUrl: 'templates/atmsandoffices.object.html'
                }
            }
        });

        $stateProvider.state('settings.paysdata', {
            url: '/paysdata',
            views: {
                'settings-view': {
                    controller: 'SettingsPaymentsDataCtrl',
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('settings/payments/payments.html'); }]
                }
            }
        });

        $stateProvider.state('socialNetworks', {
            url: '/socialNetworks',
            views: {
                'rootpane': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('settings/payments/socialNetworks.html'); }]
                }
            }
        });

        $stateProvider.state('settings.paysdata.accountMobileTelephone', {
            url: '/accountMobileTelephone',
            views: {
                'settings-payments-data-view': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('settings/payments/accountMobileTelephone.html'); }]
                }
            }
        });

        $stateProvider.state('settings.paysdata.accountHomeTelephone', {
            url: '/accountHomeTelephone',
            views: {
                'settings-payments-data-view': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('settings/payments/accountHomeTelephone.html'); }]
                }
            }
        });

        $stateProvider.state('settings.paysdata.accountSNILS', {
            url: '/accountSNILS',
            views: {
                'settings-payments-data-view': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('settings/payments/accountSNILS.html'); }]
                }
            }
        });

        $stateProvider.state('settings.paysdata.accountOMS', {
            url: '/accountOMS',
            views: {
                'settings-payments-data-view': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('settings/payments/accountOMS.html'); }]
                }
            }
        });

        $stateProvider.state('settings.paysdata.accountFine', {
            url: '/accountFine',
            views: {
                'settings-payments-data-view': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('settings/payments/accountFine.html'); }]
                }
            }
        });

        $stateProvider.state('settings.paysdata.accountINN', {
            url: '/accountINN',
            views: {
                'settings-payments-data-view': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('settings/payments/accountINN.html'); }]
                }
            }
        });

        $stateProvider.state('settings.paysdata.accountFSPP', {
            url: '/accountFSPP',
            views: {
                'settings-payments-data-view': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('settings/payments/accountFSPP.html'); }]
                }
            }
        });

        $stateProvider.state('settings.paysdata.accountOther', {
            url: '/accountOther',
            views: {
                'settings-payments-data-view': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('settings/payments/accountOther.html'); }]
                }
            }
        });

        $stateProvider.state('settings.paysdata.selectCreatedPersonalAccount', {
            url: '/selectCreatedPersonalAccount',
            views: {
                'settings-payments-data-view': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('settings/payments/selectCreatedPersonalAccount.html'); }]
                }
            }
        });

        $stateProvider.state('settings.security', {
            url: '/security',
            views: {
                'settings-view': {
                    controller: 'SettingsSecurityDataCtrl',
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('settings/security/security.html'); }]
                }
            }
        });

        $stateProvider.state('settings.application', {
            url: '/application',
            views: {
                'settings-view': {
                    controller: 'SettingsApplicationDataCtrl',
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('settings/application/application.html'); }]
                }
            }
        });

        $stateProvider.state('settings.security.login', {
            url: '/login',
            views: {
                'settings-security-data-view': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('settings/security/login.html'); }]
                }
            }
        });

        $stateProvider.state('settings.security.password', {
            url: '/password',
            views: {
                'settings-security-data-view': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('settings/security/password.html'); }]
                }
            }
        });

        $stateProvider.state('settings.security.codeDate', {
            url: '/codeDate',
            views: {
                'settings-security-data-view': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('settings/security/codeDate.html'); }]
                }
            }
        });

        $stateProvider.state('settings.security.confirmMethod', {
            url: '/confirmMethod',
            views: {
                'settings-security-data-view': {
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('settings/security/confirmMethod.html'); }]
                }
            }
        });

        $stateProvider.state('howToConnect', {
            url: '/howToConnect',
            views: {
                'rootpane': {
                    controller: 'HowToConnectCtrl',
                    templateProvider: ['sys', function(sys) { return sys.getTplByPlatform('auth/howToConnect.html'); }]
                }
            }
        });
    }]);
}());