var app = angular.module('app');

/**
 * Платежи по реквизитам.
 */
app.controller('PaymentWithDetailsCtrl', ['$scope', '$state', '$stateParams', '$ionicModal', 'sys', 'commonSrv', 'paymentSrv', 'WebWorker',
    function ($scope, $state, $stateParams, $ionicModal, sys, commonSrv, paymentSrv, WebWorker) {
        /* Формат назначения платежа для перевода на брокерский счёт */
        var formatGround = 'Перечисление денежных средств по Договору №{0} от {1}г. ТС {2}. НДС не облагается.';

        function init() {
            if (!$scope.template) {
                $scope.payment.absid = null;
                $scope.payment.client = null;
                $scope.payment.clientINN = null; // Реквизиты плательщика - ИНН
                $scope.payment.clientKPP = null;
                $scope.payment.clientName = null; // Реквизиты плательщика - Наименование
                $scope.payment.clientState = null;
                $scope.payment.documentClDate = null;
                $scope.payment.documentClTime = null;
                $scope.payment.documentDate = null;
                $scope.payment.documentKind = null;
                $scope.payment.documentNumber = null;
                $scope.payment.documentTime = null;
                $scope.payment.ground = null; // Назначение платежа
                $scope.payment.ignoreChangeComm = null;
                $scope.payment.isCommissionCalc = null;
                $scope.payment.isTaxPayment = null;
                $scope.payment.KBK = null; // Налоговые поля - КБК (104)
                $scope.payment.NDS = 0;
                $scope.payment.ndsGround = null;
                $scope.payment.ndsIncluded = false;
                $scope.payment.payCode = null; // Реквизиты получателя платежа - Код
                $scope.payment.payee = null;
                $scope.payment.payeeAccount = null; // Реквизиты получателя платежа - Счет
                $scope.payment.payeeAccountBase = null;
                $scope.payment.payeeBank = null;
                $scope.payment.payeeBankBIK = null; // Реквизиты банка получателя - БИК
                $scope.payment.payeeBankCorAcc = null; // Реквизиты банка получателя - Наименование
                $scope.payment.payeeBankName = null; // Реквизиты банка получателя - Кор. счет
                $scope.payment.payeeINN = null; // Реквизиты получателя платежа - ИНН
                $scope.payment.payeeKPP = null; // Реквизиты получателя платежа - КПП
                $scope.payment.payeeName = null; // Реквизиты получателя платежа - Наименование
                $scope.payment.payeeNameBase = null;
                $scope.payment.payeeTypeValue = null;
                $scope.payment.payerOkato = null; // Налоговые поля - ОКТМО (105)
                $scope.payment.rejectCause = null;
                $scope.payment.showCommission = null;
                $scope.payment.sourceProduct = null;
                $scope.payment.state = null;
                $scope.payment.sum = null; // Сумма
                $scope.payment.supplierGround = null;
                $scope.payment.taxDocDate = null; // Налоговые поля - Дата документа (109)
                $scope.payment.taxDocNumber = null; // Налоговые поля - Номер документа (108)
                $scope.payment.taxGroundValue = null; // Налоговые поля - Основание налогового платежа (106)
                $scope.payment.taxPayerStatus = null;
                $scope.payment.taxPaymentGround = null;
                $scope.payment.taxPaymentType = null;
                $scope.payment.taxPeriod = null; // Налоговые поля - Налоговый период (107)
                $scope.payment.taxStatusValue = null; // Налоговые поля - Статус составителя (101)
                $scope.payment.taxTypeValue = null; // Налоговые поля - Тип налогового платежа (110)
                $scope.payment.totalSum = null;
                $scope.payment.totalSumCurrency = null;
                $scope.payment.typePayment = null;
            }
            $scope.payment.isTaxPayment = $stateParams.isTaxPayment;
            $scope.payment.typePayment = $stateParams.typePayment ? $stateParams.typePayment : {};
            $scope.payment.transferType = $scope.payment.typePayment;

            $scope.payment.payeeType = $stateParams.payeeType ? $stateParams.payeeType : {};
            $scope.payment.payeeTypeValue = $stateParams.payeeType ? $stateParams.payeeType.strId : null;
            $scope.payment.payeeTypeDesc = $stateParams.payeeType ? $stateParams.payeeType.desc : null;

            $scope.payment.userDebtId = $stateParams.userDebtId ? $stateParams.userDebtId : null;

            $scope.payment.transferTypes = paymentSrv.getTransferTypes();
            $scope.payment.personTypes = paymentSrv.getPersonTypes();
            $scope.payment.naturalPersonTypes = paymentSrv.getNaturalPersonTypeList();

            $scope.payment.taxPayerStates = [];
            $scope.payment.taxPaymentGrounds = [];

            if ($scope.isPersonTransferType()) {
                if ($scope.getClientName() === $scope.payment.payeeName) {
                    $scope.payment.naturalPersonSelected = $scope.payment.naturalPersonTypes.TO_SELF;
                } else {
                    $scope.payment.naturalPersonSelected = $scope.payment.naturalPersonTypes.TO_OTHER;
                }
            }
            if ($scope.isJuridicalPayment()) {
                if (paymentSrv.getVatValuesList() == null) {
                    $scope.saveDataForSessionTimeout($scope.payment);
                    WebWorker.postMessage('getJuridicalPaymentParams', 'getJuridicalPaymentParams', []);
                } else {
                    $scope.payment.paymentVats = paymentSrv.getVatValuesList();
                    $scope.payment.paymentVatValue = $scope.payment.paymentVats[0];
                    $scope.payment.NDS = $scope.payment.paymentVatValue.nds;
                    $scope.payment.ndsIncluded = $scope.payment.paymentVatValue.included;
                }
            }

            if ($scope.isTaxOrBudgetPayment()) {
                $scope.payment.payCode = "0";
                $scope.payment.taxPeriod = "0";
            }

            if ($scope.payment.transferType.strId == $scope.payment.personTypes.NATURAL_PERSON.strId) {
                $scope.payment.NDS = 0;
                $scope.payment.payeeKPP = '';
                $scope.payment.payeeTypeValue = $scope.payment.personTypes.NATURAL_PERSON.strId;
            } else if ($scope.payment.transferType.strId == $scope.payment.transferTypes.BROKER.strId) {
                WebWorker.postMessage('getBrokerPaymentParams', 'getBrokerPaymentParams', []);
                $scope.payment.payeeTypeValue = $scope.payment.personTypes.JURIDICAL.strId;
                $scope.saveDataForSessionTimeout($scope.payment);
                WebWorker.invoke('getEntitiesByCondition', 'codifier', 'brokertrademarket', 'true').then(
                    function(result) {
                        $scope.payment.brokerTradeMarketList = result.data;
                        if (!$scope.payment.brokerTradeMarket) {
                            $scope.payment.brokerTradeMarket = $scope.payment.brokerTradeMarketList[0];
                        }
                    }
                );

                // FIXME: маска
                if (!$scope.payment.payeeAccount) {
                    $scope.payment.payeeAccount = 3060;
                }
            } else if ($scope.payment.transferType.strId == $scope.payment.transferTypes.JURIDICAL.strId ) {
                $scope.payment.payeeTypeValue = $scope.payment.personTypes.JURIDICAL.strId;
            } else if ($scope.payment.transferType.strId == $scope.payment.transferTypes.BUDGETPAY.strId) {
                $scope.payment.payeeTypeValue = $scope.payment.personTypes.JURIDICAL.strId;
            } else if ($scope.payment.transferType.strId == $scope.payment.transferTypes.TAXPAY.strId) {
                $scope.payment.isTaxPayment = true;
                $scope.payment.payeeTypeValue = $scope.payment.personTypes.JURIDICAL.strId;
            } else {
                $scope.payment.payeeTypeValue = $scope.payment.personTypes.JURIDICAL.strId;
            }

            /*
             * Согласно приказу приказу 126н отменяет использование поля «Тип налогового платежа (110)» в распоряжениях
             * о переводе денежных средств в уплату платежей в бюджетную систему Российской Федерации
             */
            $scope.payment.taxPaymentType = null;
            $scope.payment.taxTypeValue = null;

            $scope.setClientInn();
            $scope.setClientKpp();
            $scope.setClientName();
            $scope.ndsSum = $scope.getNdsSumValue();
            $scope.checkPayeeBankBIC();
        }

        // <для подтверждения одноразовым паролем>
        var args = [];
        var confirmActionStrId = paymentSrv.getPaymentConfirmActionStrId();
        // </для подтверждения одноразовым паролем>

        $scope.setClientInn = function () {
            $scope.payment.clientINN = $scope.retailClient.inn;
        };

        // Автозаполнение поля КПП плательщика в случае если счёт получателя начинается с 40101
        $scope.setClientKpp = function () {
            if ($scope.payment.payeeAccount && $scope.payment.payeeAccount.toString().indexOf('40101') != -1) {
                $scope.payment.clientKPP = '0';
            } else {
                $scope.payment.clientKPP = '';
            }
        };

        $scope.getClientName = function () {
            var client = $scope.retailClient;
            if (!client) {
                return "";
            }
            var clientSurname = client.clientSurname ? client.clientSurname : '';
            var clientName = client.clientName ? client.clientName : '';
            var clientSecondName = client.clientSecondName ? client.clientSecondName : '';
            return clientSurname + ' ' + clientName + ' ' + clientSecondName;
        };

        // Автозаполнение поля Наименование клиента
        $scope.setClientName = function () {
            var client = $scope.retailClient;
            if (client != null) {
                var payerName = $scope.getClientName();
                var payeeAccount = $scope.payment.payeeAccount; // FIXME: узнать где и когда он проставляется
                var lawSubject = client.lawSubject; // TODO: добавить
                if (("SP" === lawSubject.value || "NOT" === lawSubject.value || "JUD" === lawSubject.value ||
                    "FARM" === lawSubject.value || "RET" === lawSubject.value) && payeeAccount && payeeAccount.toString().match(/^40101.*$/ig)) {

                    payerName += String.format(" (%s)", lawSubject);
                    var payerAddress = " //";
                    var payCode = $scope.payment.payCode; // TODO: узнать и когда где проставляется
                    var clientINN = $scope.payment.clientINN;
                    if ((!payCode || "" == payCode || "0" === payCode) && clientINN.length == 0) {
                        if (client.factAddress) { // TODO: добавить
                            payerAddress += client.factAddress;
                        } else {
                            if (client.regAddress) { // TODO: добавить
                                payerAddress += client.regAddress;
                            }
                        }
                    }
                    payerAddress += "//";
                    payerName = payerName + payerAddress;
                }
                $scope.payment.clientName = payerName.length > 160 ? payerName.substr(0, 159) : payerName;
            }
        };

        $scope.getNdsSumValue = function () {
            //TODO: выяснить где устанавливаются
            var nds = $scope.NDS;
            var sum = $scope.sum;
            return (!nds || !sum) ? null : ((1.00 * sum * nds) / (100.00 + nds)).toFixed(2);
        };

        // <доп состояния документа>
        $scope.isIndividualEntrepreneur = function() {
            return $scope.payment.payeeType && $scope.payment.payeeType.strId == $scope.payment.personTypes.INDIVIDUAL_ENTREPRENEUR.strId;
        };

        $scope.isJuridicalPayment = function() {
            return $scope.payment.transferType && $scope.payment.transferType.strId == $scope.payment.transferTypes.JURIDICAL.strId;
        };

        $scope.isPersonTransferType = function() {
            return $scope.payment.transferType && $scope.payment.transferType.strId == $scope.payment.transferTypes.OTHERCLIENT.strId;
        };

        $scope.isReadOnlyTaxPayment = function() {
            return $scope.payment.personTypes.NATURAL_PERSON.strId == $scope.payment.transferType.strId || $scope.payment.userDebtId;
        };

        $scope.isTaxOrBudgetPayment = function() {
            return $scope.payment.transferType && ($scope.payment.transferType.strId == $scope.payment.transferTypes.BUDGETPAY.strId
                || $scope.payment.transferType.strId == $scope.payment.transferTypes.TAXPAY.strId);
        };

        $scope.isJuridicalOrTaxOrBudgetPayment = function() {
            return $scope.isJuridicalPayment() || $scope.isTaxOrBudgetPayment();
        };

        $scope.isReadOnlyDebtPayment = function() {
            return $scope.payment.userDebtId != null && !$scope.isCopyMode();
        };

        $scope.isReadOnlyPayeeName = function() {
            return $scope.isReadOnlyDebtPayment() || ($scope.payment.transferType &&
                (($scope.payment.naturalPersonSelected && $scope.payment.naturalPersonTypes.TO_SELF.strId == $scope.payment.naturalPersonSelected.strId) || $scope.isBrokerAccountTransfer()));
        };

        $scope.isBrokerAccountTransfer = function() {
            return $scope.payment.transferType && $scope.payment.transferType.strId == $scope.payment.transferTypes.BROKER.strId;
        };

        $scope.isReadOnlyPayCode = function() {
            return $scope.isReadOnlyDebtPayment() || $scope.isTemplateMode();
        };

        $scope.isVisiblePayeeTypeSet = function () {
            return $scope.payment.transferType && $scope.payment.transferType.strId == $scope.payment.transferTypes.JURIDICAL.strId;
        };
        // </доп состояния документа>

        $scope.checkPayeeBankBIC = function() {
            $scope.payment.isFilledBIK = $scope.payment.payeeBankBIK && $scope.payment.payeeBankBIK.length == 9;
            if ($scope.payment.isFilledBIK) {
                $scope.saveDataForSessionTimeout($scope.payment);
                WebWorker.postMessage('getPayeeBank', 'getPayeeBank', [$scope.payment.payeeBankBIK]);
            }
        };

        function processingResults(data) {
            switch (data.cmdInfo) {
                case 'getJuridicalPaymentParams':
                    paymentSrv.setVatValuesList(data.result.data.ndsValues);
                    $scope.payment.paymentVats = paymentSrv.getVatValuesList();
                    $scope.payment.paymentVatValue = $scope.payment.paymentVats[0];
                    $scope.payment.NDS = $scope.payment.paymentVatValue.nds;
                    $scope.payment.ndsIncluded = $scope.payment.paymentVatValue.included;
                    break;

                case 'RetailRegularPeriod':
                case 'DayOfWeek':
                case 'Month':
                case 'RegularPaySumType':
                case 'RegularPayDecision':
                    paymentSrv.setCodifierListByStrId(data.cmdInfo, data.result.data);
                    break;

                case 'getBrokerPaymentParams':
                    $scope.payment.payeeName = data.result.data.payeeName;
                    $scope.payment.payeeBankName = data.result.data.payeeBankName;
                    $scope.payment.payeeBankBIK = data.result.data.payeeBankBIK;
                    $scope.payment.payeeBankCorAcc = data.result.data.payeeBankCorAcc;
                    break;

                case 'getSourcesListForPayment':
                    $scope.payment.paymentSourceList = data.result.data;
                    $scope.payment.sourceProduct = $scope.getElementById($scope.payment.paymentSourceList, $scope.payment.sourceProductId);
                    $scope.payment.sourceProductId = undefined;
                    break;

                case 'getPayeeBank':
                    if (data.result && data.result.data && data.result.data[0]) {
                        $scope.payment.payeeBankBIK = data.result.data[0].BIC;
                        $scope.payment.payeeBankName = data.result.data[0].name;
                        $scope.payment.payeeBankCorAcc = data.result.data[0].corAcc;
                    } else {
                        $scope.payment.isFilledBIK = false;
                    }
                    break;

                case 'taxpayerstate':
                    paymentSrv.setTaxCodifierListByStrId(data.cmdInfo, data.result.data);
                    $scope.payment.taxPayerStates = paymentSrv.getTaxCodifierListByStrId(data.cmdInfo);
                    break;

                case 'taxpaymentground':
                    paymentSrv.setTaxCodifierListByStrId(data.cmdInfo, data.result.data);
                    $scope.payment.taxPaymentGrounds = paymentSrv.getTaxCodifierListByStrId(data.cmdInfo);
                    break;

                case 'validateAndSaveRetailRubPayment':
                    delete($scope.payment.resultValue);
                    if (!data.result.data) {
                        $scope.setEditMode();
                        $scope.payment.showConfirmButton = false;
                        alert('При отправке заявки произошла ошибка');
                    } else if (data.result.data.hasErrors) {
                        $scope.setEditMode();
                        $scope.payment.showConfirmButton = false;
                        alert(data.result.data.error, 'Обратите внимание!');
                    } else {
                        // <для подтверждения одноразовым паролем>
                        var resultValue = data.result.data.result;
                        $scope.payment.resultValue = resultValue;
                        if (resultValue == confirmActionStrId) {
                            $scope.setViewMode();
                            $scope.payment.showConfirmButton = true;
                            $scope.payment.absid = data.result.data.absid;
                            $scope.payment.requestId = data.result.data.requestId;
                            $scope.payment.totalSum = data.result.data.totalSum;
                        } else if (resultValue == 'otpConfirm' || resultValue == 'codeDateConfirm') {
                            //$scope.setEditMode();
                            $scope.payment.showConfirmButton = true;

                            $scope.confirmationShow(data.cmdInfo, args, resultValue == 'otpConfirm');
                            return;
                        } else if (resultValue == 'true') {
                            $scope.setViewMode();
                            $scope.payment.showConfirmButton = false;
                            $scope.confirmationHide();

                            // Действия после успешной отправки.
                            alert('Принято в обработку').finally(function() {
                                if ($scope.payment.paymentModeParams.actionStrId == 'saveTemplate') {
                                    $scope.goBack();
                                } else {
                                    $scope.redirectToOperationFromPayment(data.result.data.operation);
                                }
                            });
                        } else if (resultValue == 'otpFalse' || resultValue == 'codeDateFalse') {
                            $scope.confirmationFalse(resultValue);
                            return;
                        } else {
                            $scope.confirmationHide();
                            $scope.payment.showConfirmButton = true;
                            alert(resultValue);
                        }
                        // </для подтверждения одноразовым паролем>
                    }
                    break;
            }
            $scope.$applyAsync();
        }
        WebWorker.setFunction(processingResults);

        // Инициализацию initPayment выполняем только после того, как данные retailClient пришли
        var stopWatching = $scope.$watch('retailClient', function (newValue) {
            if (angular.isDefined(newValue)) {
                stopWatching();
                $scope.initPayment(init);

                if (!$scope.payment.paymentSourceList || $scope.payment.paymentSourceList.length == 0) {
                    $scope.saveDataForSessionTimeout($scope.payment);
                    WebWorker.postMessage('getSourcesListForPayment', 'getSourcesListForPayment', [$scope.payment.transferType.strId]);
                }
                if ($scope.isTaxOrBudgetPayment()) {
                    $scope.payment.taxPayerStates = paymentSrv.getTaxCodifierListByStrId('taxpayerstate');
                    if (!$scope.payment.taxPayerStates) {
                        $scope.saveDataForSessionTimeout($scope.payment);
                        WebWorker.postMessage('getEntitiesByCondition', 'taxpayerstate', ['codifier', 'taxpayerstate', '\\exp.fo.filterCodeKindValueOnContext({"retail"})', 'value']);
                    }
                    $scope.payment.taxPaymentGrounds = paymentSrv.getTaxCodifierListByStrId('taxpaymentground');
                    if (!$scope.payment.taxPaymentGrounds) {
                        $scope.saveDataForSessionTimeout($scope.payment);
                        WebWorker.postMessage('getEntitiesByCondition', 'taxpaymentground', ['codifier', 'taxpaymentground', '!inactive', 'value']);
                    }
                }
                if (!paymentSrv.getCodifierListByStrId('RegularPayDecision')) {
                    $scope.saveDataForSessionTimeout($scope.payment);
                    WebWorker.postMessage('getEntitiesByCondition', 'RetailRegularPeriod', ['codifier', 'RetailRegularPeriod', 'id in \\dict.PeriodPayDepends[!\\fn.isNull(periodicity) && isActive].periodicity.id']);
                    WebWorker.postMessage('getEntitiesByCondition', 'DayOfWeek', ['codifier', 'DayOfWeek', 'value != "ANY" && value != "0"']);
                    WebWorker.postMessage('getEntitiesByCondition', 'Month', ['codifier', 'Month', 'true']);
                    WebWorker.postMessage('getEntitiesByCondition', 'RegularPaySumType', ['codifier', 'RegularPaySumType', 'true && value in {"FIX", "PERCENT"}']);
                    WebWorker.postMessage('getEntitiesByCondition', 'RegularPayDecision', ['codifier', 'RegularPayDecision', 'true']);
                }

                /* При протухании сессии при поиске по БИК нужно запросить снова */
                $scope.checkPayeeBankBIC();

                $scope.$applyAsync();
            }
        });

        // <Панель для выбора кодификатора>
        $ionicModal.fromTemplateUrl('templates/' + sys.getPlatform() + '/card/select.codifier.html', function($ionicModal) {
            $scope.selectCodifierPanel = $ionicModal;
        }, {
            scope: $scope
        });

        $scope.onSelectCodifierPanel = function (codifiers, codifierStrId, codifierWithValue) {
            $scope.codifierWithValue = !!codifierWithValue;
            $scope.codifiers = codifiers;
            $scope.codifierStrId = codifierStrId;
            if ($scope.codifierStrId === 'taxPaymentGrounds') {
                $scope.selectedCodifier = { value: $scope.payment.taxGroundValue };
            } else if ($scope.codifierStrId === 'taxPayerStates') {
                $scope.selectedCodifier = { value: $scope.payment.taxStatusValue };
            } else if ($scope.codifierStrId === 'naturalPersonTypes') {
                $scope.selectedCodifier = $scope.payment.naturalPersonSelected;
            } else if ($scope.codifierStrId === 'personTypes') {
                var codifiersTmp = [];
                for (var index in $scope.codifiers) {
                    if ($scope.codifiers[index].strId != 'NATURAL_PERSON') {
                        codifiersTmp.push($scope.codifiers[index]);
                    }
                }
                $scope.codifiers = codifiersTmp;
                $scope.selectedCodifier = { desc: $scope.payment.payeeTypeDesc };
            } else if ($scope.codifierStrId === 'paymentVats') {
                $scope.selectedCodifier = $scope.payment.paymentVatValue;
            } else if ($scope.codifierStrId === 'brokerTradeMarket') {
                $scope.selectedCodifier = $scope.payment.brokerTradeMarket;
            }

            $scope.selectCodifierPanel.show()
        };

        $scope.clickCodifier = function(codifier) {
            $scope.selectCodifierPanel.hide();
            if ($scope.codifierStrId === 'taxPaymentGrounds') {
                $scope.payment.taxGroundValue = codifier.value;
            } else if ($scope.codifierStrId === 'taxPayerStates') {
                $scope.payment.taxStatusValue = codifier.value;
            } else if ($scope.codifierStrId === 'naturalPersonTypes') {
                $scope.payment.naturalPersonSelected = codifier;
                if ($scope.payment.naturalPersonSelected.strId == $scope.payment.naturalPersonTypes.TO_SELF.strId) {
                    $scope.payment.payeeName = $scope.getClientName();
                } else {
                    $scope.payment.payeeName = '';
                }
            } else if ($scope.codifierStrId === 'personTypes') {
                $scope.payment.payeeType = codifier;
                $scope.payment.payeeTypeDesc = codifier.desc;
                $scope.payment.payeeTypeValue = codifier.strId;
            } else if ($scope.codifierStrId === 'paymentVats') {
                $scope.payment.paymentVatValue = codifier;
                $scope.payment.NDS = $scope.payment.paymentVatValue.nds;
                $scope.payment.ndsIncluded = $scope.payment.paymentVatValue.included;
                $scope.onChangeNDS();
            } else if ($scope.codifierStrId === 'brokerTradeMarket') {
                $scope.payment.brokerTradeMarket = codifier;
                $scope.updateGroundBroker();
            }

            $scope.codifiers = [];
            $scope.codifierStrId = "";
            $scope.selectedCodifier = null;
        };
        // </Панель для выбора кодификатора>

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
            $scope.payment[$scope.resultId] = product;
        };
        // </выбор продукта>

        $scope.$on('modal.hidden', function(evt, modal) {
            if (modal == $scope.confirmPanel) {
                $scope.payment.showConfirmButton = true;
                $scope.confirmationHide();
            }
        });

        $scope.onChangeNDS = function () {
            if ($scope.isJuridicalPayment() && $scope.payment.paymentVatValue) {
                var sum = parseFloat($scope.payment.sum);
                if (isNaN(sum)) {
                    sum = parseFloat(0);
                }
                var nds = parseFloat($scope.payment.paymentVatValue.nds);
                var ndsSum;
                if ($scope.payment.paymentVatValue.included) {
                    ndsSum = ($scope.payment.sum * nds) / (100.00 + nds);
                } else {
                    ndsSum = $scope.payment.sum * (nds / 100.00);
                    $scope.payment.sum = parseFloat((ndsSum + sum).toFixed(2), 2);
                }
                $scope.payment.paymentVatSum = isNaN(ndsSum) ? parseFloat(0).toFixed(2) : ndsSum.toFixed(2);
            }
        };

        $scope.onChangeSum = function () {
            if ($scope.isJuridicalPayment() && $scope.payment.paymentVatValue) {
                var sum = parseFloat($scope.payment.sum);
                if (!isNaN(sum)) {
                    var sum = parseFloat($scope.payment.sum);
                    if (!isNaN(sum)) {
                        var nds = parseFloat($scope.payment.paymentVatValue.nds);
                        var ndsSum;
                        ndsSum = ($scope.payment.sum * nds) / (100.00 + nds);
                    }
                }
                $scope.payment.paymentVatSum = isNaN(ndsSum) ? parseFloat(0).toFixed(2) : ndsSum.toFixed(2);
            }
        };

        $scope.$watch('payment.sum',function(val,old){
            $scope.payment.sum = parseFloat(val);
        });

        $scope.sendPayment = function (action) {
            $scope.hideDatePickers();
            $scope.hideAndroidDatePickers();
            $scope.preparePeriodicalFields();
            try {
                validateRubPayment();
            } catch(e) {
                alert(e.message, 'Обратите внимание!');
                return;
            }
            $scope.setViewMode();
            var paymentForSend = getPaymentForSend();

            args = [action, JSON.stringify(paymentForSend),
                JSON.stringify($scope.payment.paymentModeParams), JSON.stringify($scope.payment.periodicalPayStruct)];

            $scope.saveDataForSessionTimeout($scope.payment);

            WebWorker.postMessage('validateAndSaveRetailRubPayment','validateAndSaveRetailRubPayment', args);
            if ($scope.payment.paymentModeParams.isVisibleTemplateFields || $scope.payment.paymentModeParams.isDeleteTemplate) {
                paymentSrv.setFavouritesList(undefined);
            }
        };

        function validateRubPayment() {
            $scope.validateSourceField($scope.payment.sourceProduct);
            if ($scope.isPersonTransferType()) {
                validatePersonTransfer();
            } else if ($scope.isJuridicalPayment()) {
                validateJuridicalPayment();
            } else if ($scope.isTaxOrBudgetPayment()) {
                validateTaxOrBudgetPayment();
            } else if ($scope.isBrokerAccountTransfer()) {
                validateBrokerAccountTransfer();
            }
            $scope.validateSumField($scope.payment.sum);
        }

        function validatePersonTransfer() {
            if ($scope.isEmptyField($scope.payment.payeeBankBIK)) {
                throw new Error('Поле "БИК банка получателя" должно быть заполнено');
            } else if ($scope.isEmptyField($scope.payment.payeeBankName)) {
                throw new Error('Поле "Наименование банка получателя" должно быть заполнено');
            } else if ($scope.isEmptyField($scope.payment.payeeAccount)) {
                throw new Error('Поле "Счет получателя" должно быть заполнено');
            } else if ($scope.isEmptyField($scope.payment.payeeName)) {
                throw new Error('Поле "Ф.И.О." должно быть заполнено');
            } else if ($scope.isEmptyField($scope.payment.ground)) {
                throw new Error('Поле "Назначение платежа" должно быть заполнено');
            }
        }

        function validateJuridicalPayment() {
            if ($scope.isEmptyField($scope.payment.payeeBankBIK)) {
                throw new Error('Поле "БИК банка получателя" должно быть заполнено');
            } else if ($scope.isEmptyField($scope.payment.payeeBankName)) {
                throw new Error('Поле "Наименование банка получателя" должно быть заполнено');
            } else if ($scope.isEmptyField($scope.payment.payeeAccount)) {
                throw new Error('Поле "Счет получателя" должно быть заполнено');
            } else if ($scope.isEmptyField($scope.payment.payeeName)) {
                throw new Error('Поле "Наименование получателя" должно быть заполнено');
            } else if ($scope.isEmptyField($scope.payment.payeeINN)) {
                throw new Error('Поле "ИНН получателя" должно быть заполнено');
            } else if ($scope.isEmptyField($scope.payment.ground)) {
                throw new Error('Поле "Назначение платежа" должно быть заполнено');
            }
        }

        function validateTaxOrBudgetPayment() {
            if ($scope.isEmptyField($scope.payment.payeeBankBIK)) {
                throw new Error('Поле "БИК банка получателя" должно быть заполнено');
            } else if ($scope.isEmptyField($scope.payment.payeeBankName)) {
                throw new Error('Поле "Наименование банка получателя" должно быть заполнено');
            } else if ($scope.isEmptyField($scope.payment.payeeAccount)) {
                throw new Error('Поле "Счет получателя" должно быть заполнено');
            } else if ($scope.isEmptyField($scope.payment.payeeName)) {
                throw new Error('Поле "Наименование получателя" должно быть заполнено');
            } else if ($scope.isEmptyField($scope.payment.payeeINN)) {
                throw new Error('Поле "ИНН получателя" должно быть заполнено');
            } else if ($scope.isEmptyField($scope.payment.payeeKPP)) {
                throw new Error('Поле "КПП получателя" должно быть заполнено');
            } else if ($scope.isEmptyField($scope.payment.ground)) {
                throw new Error('Поле "Назначение платежа" должно быть заполнено');
            } else if ($scope.isEmptyField($scope.payment.taxStatusValue)) {
                throw new Error('Поле "Статус составителя (101)" должно быть заполнено');
            } else if ($scope.isEmptyField($scope.payment.KBK)) {
                throw new Error('Поле "КБК (104)" должно быть заполнено');
            } else if ($scope.isEmptyField($scope.payment.payerOkato)) {
                throw new Error('Поле "ОКТМО (105)" должно быть заполнено;');
            } else if ($scope.isEmptyField($scope.payment.taxGroundValue)) {
                throw new Error('Поле "Основание налогового платежа (106)" должно быть заполнено');
            } else if ($scope.isEmptyField($scope.payment.taxPeriod)) {
                throw new Error('Поле "Налоговый период (107)" должно быть заполнено');
            } else if ($scope.isEmptyField($scope.payment.taxDocNumber)) {
                throw new Error('Поле "Номер документа (108)" должно быть заполнено');
            } else if ($scope.isEmptyField($scope.payment.taxDocDate)) {
                throw new Error('Поле "Дата документа (109)" должно быть заполнено');
            }
        }

        function validateBrokerAccountTransfer() {
            // из-за подставления начальных символов 3060 проверяем на всю длину
            if ($scope.isEmptyField($scope.payment.payeeAccount) || $scope.payment.payeeAccount.toString().length < 20) {
                throw new Error('Поле "Счет получателя" должно быть заполнено');
            } else if ($scope.isEmptyField($scope.payment.agreementNumber)) {
                throw new Error('Поле "Номер договора" должно быть заполнено');
            } else if (!$scope.payment.agreementDate) {
                throw new Error('Поле "Дата договора" должно быть заполнено');
            }
        }

        $scope.validatePayment = function() {
            $scope.payment.paymentModeParams.actionStrId = $scope.isNotFromTemplateAndVisibleFields() ? 'executeAndSaveTemplate' : 'execute';
            $scope.sendPayment(confirmActionStrId);
        };

        $scope.validateAndSaveTemplate = function() {
            $scope.payment.paymentModeParams.actionStrId = 'saveTemplate';
            $scope.sendPayment(confirmActionStrId);
        };

        $scope.confirmAndSavePayment = function() {
            $scope.payment.showConfirmButton = false;
            $scope.sendPayment($scope.getActionStrId());
        };

        $scope.updateGroundBroker = function() {
            if ($scope.payment.agreementNumber && $scope.payment.agreementDate && $scope.payment.brokerTradeMarket) {
                $scope.payment.ground = formatGround.format($scope.payment.agreementNumber, $scope.payment.agreementDate.format('dd.mm.yyyy'), $scope.payment.brokerTradeMarket.desc);
            } else {
                $scope.payment.ground = '';
            }
        };

        function getPaymentForSend() {
            var paymentForSend = {};
            paymentForSend.isTaxPayment = $scope.payment.isTaxPayment;
            paymentForSend.sourceProduct = $scope.payment.sourceProduct.id;
            paymentForSend.typePayment = $scope.payment.transferType.strId;
            paymentForSend.sum = $scope.payment.sum;
            paymentForSend.clientINN = $scope.payment.clientINN;
            paymentForSend.clientName = $scope.payment.clientName;
            paymentForSend.ground = $scope.payment.ground;
            paymentForSend.payeeBankBIK = $scope.payment.payeeBankBIK;
            paymentForSend.payeeBankCorAcc = $scope.payment.payeeBankCorAcc;
            paymentForSend.payeeBankName = $scope.payment.payeeBankName;
            paymentForSend.payeeTypeValue = $scope.payment.payeeTypeValue;
            paymentForSend.NDS = $scope.payment.NDS;
            paymentForSend.ndsIncluded = $scope.payment.ndsIncluded;
            paymentForSend.payeeINN = $scope.payment.payeeINN;
            paymentForSend.payeeKPP = $scope.payment.payeeKPP;
            paymentForSend.payeeName = $scope.payment.payeeName;
            paymentForSend.payCode = $scope.payment.payCode;
            paymentForSend.payeeAccount = $scope.payment.payeeAccount;
            paymentForSend.payerOkato = $scope.payment.payerOkato;
            paymentForSend.KBK = $scope.payment.KBK;
            paymentForSend.taxDocDate = $scope.payment.taxDocDate;
            paymentForSend.taxDocNumber = $scope.payment.taxDocNumber;
            paymentForSend.taxGroundValue = $scope.payment.taxGroundValue;
            paymentForSend.taxPeriod = $scope.payment.taxPeriod;
            paymentForSend.taxStatusValue = $scope.payment.taxStatusValue;
            paymentForSend.taxTypeValue = $scope.payment.taxTypeValue;
            paymentForSend.userDebtId = $scope.payment.userDebtId;
            paymentForSend.comment = $scope.payment.comment;
            if ($scope.payment.absid) paymentForSend.absid = $scope.payment.absid;
            if ($scope.payment.requestId) paymentForSend.requestId = $scope.payment.requestId;
            if ($scope.payment.totalSum) paymentForSend.totalSum = $scope.payment.totalSum;
            if ($scope.payment.brokerTradeMarket) paymentForSend.brokerTradeMarket = $scope.payment.brokerTradeMarket.value;
            if ($scope.payment.agreementNumber) paymentForSend.agreementNumber = $scope.payment.agreementNumber;
            if ($scope.payment.agreementDate) paymentForSend.agreementDate = $scope.payment.agreementDate.format('dd.mm.yyyy');
            return paymentForSend;
        }
    }
]);