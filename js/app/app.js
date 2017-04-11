window.fbAsyncInit = function() {
	FB.init({appId: '698440440177958', status: true, cookie: true,
	xfbml: true});
};
(function() {
	var e = document.createElement('script'); e.async = true;
	e.src = document.location.protocol +
	'//connect.facebook.net/en_US/all.js';
	document.getElementById('fb-root').appendChild(e);
}());

// create the module and name it scotchApp
var smrApp = angular.module('ui.bootstrap.smr', ['ngAnimate','ngCookies','angularLazyImg', 'ui.bootstrap','ngFileUpload','vcRecaptcha','infinite-scroll']),baseUrl = 'api/';

//create http  interceptors
smrApp.config(['$httpProvider', function ($httpProvider) {
    $httpProvider.interceptors.push(function ($q) {
        return {
            /* 'response': function (response) {
                //Will only be called for HTTP up to 300
                console.log(response);
                return response;
            }, */
            'responseError': function (rejection) {
                /* if(rejection.status === 401) {
                    location.reload();
                } */
				// do something on error
				console.log('error');
                return $q.reject(rejection);
            }
        };
    });
}]);


// angular animation
smrApp.animation('.slide-toggle', ['$animateCss', function($animateCss) {
	return {
		/* addClass: function(element, className, doneFn) {
			if (className == 'ng-hide') {
				var animator = $animateCss(element, {
					to: {height: '0px', opacity: 0}
				});
				if (animator) {
					return animator.start().finally(function() {
						element[0].style.height = '';
						doneFn();
					});
				}
			}
			doneFn();
		}, */
		removeClass: function(element, className, doneFn) {
			if (className == 'ng-hide') {
				var height = element[0].offsetHeight;
				var animator = $animateCss(element, {
					from: {height: '0px', opacity: 0},
					to: {height: height + 'px', opacity: 1}
				});
				if (animator) {
				 return animator.start().finally(doneFn);
				}
			}
			doneFn();
		}
	};
}])

// angular filter
smrApp.filter('num', function() {
    return function(input) {
      return parseInt(input, 10);
    };
});

// angular factory
/* smrApp.factory('focus', function($timeout, $window) {
    return function(id) {
      // timeout makes sure that it is invoked after any other event has been triggered.
      // e.g. click events that need to run before the focus or
      // inputs elements that are in a disabled state but are enabled when those events
      // are triggered.
      $timeout(function() {
        var element = $window.document.getElementById(id);
        if(element)
          element.focus();
      });
    };
}); */

// angular directive
/* smrApp.directive('eventFocus', function(focus) {
    return function(scope, elem, attr) {
      elem.on(attr.eventFocus, function() {
        focus(attr.eventFocusId);
      });

      // Removes bound events in the element itself
      // when the scope is destroyed
      scope.$on('$destroy', function() {
        elem.off(attr.eventFocus);
      });
    };
}); */

// create the controller
smrApp.controller('mainController', function($scope,$modal,$http,$filter,$cookies,$timeout,Upload,vcRecaptchaService) {
	//school slide show collection
	$scope.mainSSlides = [];
	for (var i=0; i<4; i++) {
		$scope.mainSSlides.push({
			image: '//placekitten.com/452/272',
			title: 'SMR High School ' ,
		});
	}
	//school review collection
	// Simple GET request example:
	$scope.reviewCollection = [];
	//$scope.teachCollection = [];
	$scope.showreviewCollection = [];
	$scope.commentExpand = [];
	$scope.commentLimit = 218;

	$scope.showreviewCollection['school'] = false;
	$scope.commentExpand['school'] = false;

	$scope.getReviewDatas = function(page) {
		$scope.showreviewCollection['school'] = false;
		$http({
			method: 'GET',
			url: baseUrl+'review/school.json?page='+page
		}).success(function(data) {
			$scope.reviewCollection.datas = [];
			for (var i=0; i< data._embedded.review.length; i++) {
				$scope.reviewCollection.datas.push({
					id: data._embedded.review[i].id,
					rating: data._embedded.review[i].rating,
					dateCreated: $filter('date')(data._embedded.review[i].dateCreated, 'M/dd/yyyy'),
					reviewer: data._embedded.review[i].reviewer,
					identity: data._embedded.review[i].identity,
					comment: data._embedded.review[i].comment,
					pbtl: false,
					helpful: data._embedded.review[i].totalRecommendation,
					respond_like: typeof $cookies.get('lkrp'+data._embedded.review[i].id) === 'undefined' ? false : $cookies.get('lkrp'+data._embedded.review[i].id),
					respond_report: typeof $cookies.get('rkrp'+data._embedded.review[i].id) === 'undefined' ? false : $cookies.get('rkrp'+data._embedded.review[i].id),
					isRReadonly: typeof $cookies.get('rtpp'+data._embedded.review[i].id) === 'undefined' ? false : true  ,
				});
			}
			$scope.reviewCollection.page_size = data.page_size;
			$scope.reviewCollection.total_items = parseInt(data.total_items);

			$scope.reviewCollection.changePage = function (th) {
				return $scope.getReviewDatas(th.currentPage);
			};
			return $scope.showreviewCollection['school'] = true;
		});
	};

	$scope.expandDiv = function(index) {
		$scope.commentExpand[index] = true;
	};
	$scope.expandContent = function($event,index,value) {
		angular.element($event.target).parent().html(value)/* .addClass('ng-slide-down ng-slide-down-active') */;
	};




	$scope.addLike = function($event,type,tCollection) {
			var now = new Date(),
			// this will set the expiration to 12 months
			exp = new Date(now.getFullYear()+1, now.getMonth(), now.getDate());
			if( type === 'report'){
				if(typeof $cookies.get('rkrp'+tCollection.id) === 'undefined' ){
					tCollection.pbtl = true;
					$http({
						method: 'POST',
						url: baseUrl+'review/report.json',
						data: {reviewId : tCollection.id}
					}).success(function(data) {
						$cookies.put('rkrp'+tCollection.id,type,{
							expires:exp,
						});
						tCollection.respond_report = type;
						return tCollection.pbtl = false;
					});
				}
			}
			else if( type === 'like'){
				if(typeof $cookies.get('lkrp'+tCollection.id) === 'undefined' ){
					tCollection.pbtl = true;
					$http({
						method: 'POST',
						url: baseUrl+'review/recommend.json',
						data: {reviewId : tCollection.id}
					}).success(function(data) {
						$cookies.put('lkrp'+tCollection.id,type,{
							expires:exp,
						});
						tCollection.helpful = data.total;
						tCollection.respond_like = type;
						return tCollection.pbtl = false;
					});
				}
			}
	};
	$scope.getReviewDatas(1);

	/* teacher review teacher */
	$scope.reviewteacherCollection = [];
	$scope.teacher_page = 1;
	$scope.teacher_max_page = null;
	$scope.getRTeachereviewDatas = function(page) {
		$scope.showreviewCollection['teacher'] = false;
		$http({
			method: 'GET',
			url: baseUrl+'teacher.json?page='+page
		}).success(function(data) {
			$scope.teacher_max_page = data.page_count;
			$scope.reviewteacherCollection.datas = [];
			for (var i=0; i< data._embedded.teacher.length; i++) {
				$scope.reviewteacherCollection.datas[i] = [];
				$scope.reviewteacherCollection.datas[i].idq = data._embedded.teacher[i].id+Number(data._embedded.teacher[i].firstNam);
				$scope.reviewteacherCollection.datas[i].id = data._embedded.teacher[i].id;
				$scope.reviewteacherCollection.datas[i].firstName = data._embedded.teacher[i].firstName;
				$scope.reviewteacherCollection.datas[i].fullName = data._embedded.teacher[i].firstName+' '+data._embedded.teacher[i].lastName;
				$scope.reviewteacherCollection.datas[i].title = data._embedded.teacher[i].title;
				$scope.reviewteacherCollection.datas[i].resizingPath = data._embedded.teacher[i].resizingPath === null ? 'images/teacher-icon.png' : data._embedded.teacher[i].resizingPath;
				$scope.reviewteacherCollection.datas[i].disablerating = typeof $cookies.get('rtpp'+data._embedded.teacher[i].id) === 'undefined' ? false : true ;
				$scope.reviewteacherCollection.datas[i].rating = data._embedded.teacher[i].ratingAvg/data._embedded.teacher[i].ratingCounter;
				$scope.reviewteacherCollection.datas[i].ratingAvg = data._embedded.teacher[i].ratingAvg;
				$scope.reviewteacherCollection.datas[i].ratingCounter = data._embedded.teacher[i].ratingCounter;
				/* $scope.reviewteacherCollection.datas[i].commentExpand = false; */
				$scope.commentExpand['teacher_'+data._embedded.teacher[i].id] = false;
				$scope.reviewteacherCollection.datas[i].reviewCollection = [];

				/* teacher's reviews */
				/* list review */
				$scope.reviewteacherCollection.datas[i].getReviewDatas = function(node,page) {
					node.showreviewCollection = false;
					$http({
						method: 'GET',
						url: baseUrl+'teacher/review/'+node.id+'.json?page='+page
					}).success(function(rdata) {
							node.reviewCollection = [];
							node.reviewCollection.page_size = rdata.page_size;
							node.reviewCollection.total_items = rdata.total_items;
							if(parseInt(rdata.total_items)){
								node.reviewCollection.datas = [];
								for (var i=0; i< rdata._embedded.reviews.length; i++) {
									node.reviewCollection.datas.push({
										id: rdata._embedded.reviews[i].id,
										rating: rdata._embedded.reviews[i].rating,
										dateCreated: $filter('date')(rdata._embedded.reviews[i].dateCreated, 'M/dd/yyyy'),
										reviewer: rdata._embedded.reviews[i].reviewer,
										identity: rdata._embedded.reviews[i].identity,
										comment: rdata._embedded.reviews[i].comment,
										pbtl: false,
										helpful: rdata._embedded.reviews[i].totalRecommendation,
										respond_like: typeof $cookies.get('lkrp'+rdata._embedded.reviews[i].id) === 'undefined' ? false : $cookies.get('lkrp'+rdata._embedded.reviews[i].id)  ,
										respond_report: typeof $cookies.get('rkrp'+rdata._embedded.reviews[i].id) === 'undefined' ? false : $cookies.get('rkrp'+rdata._embedded.reviews[i].id)  ,
										isRReadonly: true/* typeof $cookies.get('rtpp'+rdata._embedded.reviews[i].id) === 'undefined' ? false : true */  ,
									});
								}
								node.reviewCollection.changePage = function (th) {
									return node.getReviewDatas(node,th);
								};
							}
							return node.showreviewCollection = true;
						});
					};
				/* if( i == 0)
					$scope.openReviewModal('teacher',$scope.reviewteacherCollection.datas[i]);   */
				/* teacher's reviews */
				$scope.reviewteacherCollection.datas[i].getReviewDatas($scope.reviewteacherCollection.datas[i],1);


				/* add subscribe form */
				$scope.reviewteacherCollection.datas[i].form = [];
				$scope.reviewteacherCollection.datas[i].form.addsubscribe = {
					danger: false,
					success: false,
					qdanger: '',
					sbemail: true ,
					processing: false ,
				};
				$scope.reviewteacherCollection.datas[i].sendSB = function(node) {
					if( !( typeof this.form.sbemail === 'undefined' || this.form.sbemail.trim() === '' ? false : true ) )
						return this.form.addsubscribe.sbemail = false;
					var re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
					if( !re.test(this.form.sbemail.trim()) )
						return this.form.addsubscribe.sbemail = false;
					this.form.addsubscribe.processing = true;
					$http({
						method: 'POST',
						url: baseUrl+'teacher/subscribe.json',
						data:{
							teacherId : this.id,
							emailAddress : this.form.sbemail.trim(),
						}
					}).success(function(rdata) {
						node.form.addsubscribe.processing = false;
						return node.form.addsubscribe.success = true;
					}).error(function(data, status, headers, config) {
						node.form.addsubscribe.processing = false;
						return node.form.addsubscribe.danger = true;
						//return node.form.addsubscribe.qdanger = 'Subscribtion cannot be processed right now';
					});

				};
				$scope.reviewteacherCollection.datas[i].addRate = function(node) {
					if(this.rating > 0 && typeof $cookies.get('rtpp'+this.id) === 'undefined' ){
						this.disablerating = true;
						$http({
							method: 'POST',
							url: baseUrl+'teacher/rate.json',
							data:{
								teacherId : this.id,
								rating : this.rating,
							}
						}).success(function(rdata) {
							var now = new Date(),
							// this will set the expiration to 12 months
							exp = new Date(now.getFullYear()+1, now.getMonth(), now.getDate());
							$cookies.put('rtpp'+node.id,true,{
								expires:exp,
							});
							node.ratingAvg = rdata.ratingAvg;
							node.ratingCounter = rdata.ratingCounter;
							node.rating_danger = false;
							return node.rating = rdata.ratingAvg/rdata.ratingCounter;
						}).error(function(data, status, headers, config) {
							node.disablerating = false;
							return node.rating_danger = true;
							//return node.form.addsubscribe.qdanger = 'Subscribtion cannot be processed right now';
						});
					}
				};

			}
			$scope.reviewteacherCollection.page_size = data.page_size;
			$scope.reviewteacherCollection.total_items = parseInt(data.total_items);

			/* $scope.reviewteacherCollection.changePage = function (th) {
				return $scope.getRTeachereviewDatas(th.currentPage);
			}; */
			$scope.teacher_page++;
			return $scope.showreviewCollection['teacher'] = true;
		});
	};
	$scope.getRTeachereviewDatas($scope.teacher_page);

	$scope.myPagingFunction = function() {
		if($scope.showreviewCollection['teacher'] && $scope.teacher_max_page > $scope.teacher_page)
			return $scope.getRTeachereviewDatas($scope.teacher_page);
	};

	/* subscribed teacher */

	/* subscribed teacher */

	$scope.form = [];


	/* write review */

	$scope.form.addreviewForm = {
		modalTitle: '',
		danger: false,
		success: false,
		qdanger: '',
		atrating: true ,
		atreviewer: true ,
		atfirstname: true ,
		atlastname: true ,
		atidentity: true ,
		atreview: true ,
		processing: false ,
	};
	$scope.openReviewModal = function (type,node) {
		$scope.form.addreviewForm.rating = 0;
		$scope.form.addreviewForm.reviewer = '';
		$scope.form.addreviewForm.firstname = '';
		$scope.form.addreviewForm.lastname = '';
		$scope.form.addreviewForm.identity = '';
		$scope.form.addreviewForm.review = '';

		$scope.form.addreviewForm.danger = false;
		$scope.form.addreviewForm.success = false;
		$scope.form.addreviewForm.modalTitle = type === 'teacher'? node.fullName : 'St.Mary Ryken';
		$modal.open({
			templateUrl: 'ReviewModalContent.html',
			controller: function ($scope, $modalInstance) {
					$scope.ok = function () {
						if($scope.form.addreviewForm.processing)
							return;

						$scope.form.addreviewForm.atrating = true;
						$scope.form.addreviewForm.atreviewer = true;
						$scope.form.addreviewForm.atfirstname = true;
						$scope.form.addreviewForm.atlastname = true;
						$scope.form.addreviewForm.atidentity = true;
						$scope.form.addreviewForm.atreview = true;

						if( !( typeof $scope.form.addreviewForm.rating === 'undefined' || $scope.form.addreviewForm.rating === '' ? false : true ) ){
							$scope.form.addreviewForm.atrating = false;return document.getElementById('addreviewForm-rating').focus();}

						if( !( typeof $scope.form.addreviewForm.reviewer === 'undefined' || $scope.form.addreviewForm.reviewer === '' ? false : true ) ){
							$scope.form.addreviewForm.atreviewer = false;return document.getElementById('addreviewForm-reviewer').focus();}
						else if( $scope.form.addreviewForm.reviewer === 'myname' ){
							if( !( typeof $scope.form.addreviewForm.firstname === 'undefined' || $scope.form.addreviewForm.firstname === '' ? false : true ) ){
								$scope.form.addreviewForm.atfirstname = false;return document.getElementById('addreviewForm-firstname').focus(); }
							if( !( typeof $scope.form.addreviewForm.lastname === 'undefined' || $scope.form.addreviewForm.lastname === '' ? false : true ) ){
								$scope.form.addreviewForm.atlastname = false;return document.getElementById('addreviewForm-lastname').focus(); }
						}

						if( !( typeof $scope.form.addreviewForm.identity === 'undefined' || $scope.form.addreviewForm.identity === '' ? false : true ) ){
							$scope.form.addreviewForm.atidentity = false;return document.getElementById('addreviewForm-identity').focus();
						}

						if( !( typeof $scope.form.addreviewForm.review === 'undefined' || $scope.form.addreviewForm.review === '' ? false : true ) ){
							$scope.form.addreviewForm.atreview = false;return document.getElementById('addreviewForm-review').focus();
						}

						$scope.form.addreviewForm.processing = true;
						var _node = $scope;
						$http({
							method: 'POST',
							url: baseUrl+'review.json',
							data:{
								entity : type,
								entityId : type === 'teacher'? node.id : 1 ,
								reviewer : $scope.form.addreviewForm.reviewer === 'myname' ? $scope.form.addreviewForm.firstname+' '+$scope.form.addreviewForm.lastname : $scope.form.addreviewForm.reviewer ,
								identity : $scope.form.addreviewForm.identity ,
								rating : $scope.form.addreviewForm.rating ,
								comment : $scope.form.addreviewForm.review ,
							}
						}).success(function(rdata) {
							_node.form.addreviewForm.success = true;
							return $timeout(function(){
								$modalInstance.close();
								_node.form.addreviewForm.processing = false;
								if(type === 'teacher')
									return node.getReviewDatas(node,1);
								else
									return _node.getReviewDatas(1);
							}, 1500);
						}).error(function(data, status, headers, config) {
							_node.form.addreviewForm.processing = false;
							return _node.form.addreviewForm.danger = true;
						});

					};
					$scope.cancel = function () {
						$modalInstance.dismiss('cancel');
					};
			},
			size: 'lg',
			scope : $scope ,
		});
	};

	$scope.shareFb = function(node){console.log(node.resizingPath);
		FB.ui(
		  {
			method: 'share',
			name: "St.Mary's Ryken High School Review - "+node.fullName,
			title: "St.Mary's Ryken High School Review - ",
			caption: node.fullName,
			description: node.title,
			picture: document.URL+node.resizingPath,
			href: document.URL+'#teacher-'+node.id,
		  },
		  function(response) {
			if (response && !response.error_code) {
				$http({
					method: 'POST',
					url: baseUrl+'teacher/share.json',
					data:{
						teacherId : node.id,
						entity : 'teacher',
						medium : 'facebook',
					}
				}).success(function(rdata) {
					return;
				}).error(function(data, status, headers, config) {
					return alert('Error while posting.');
				});
			} else if (response && response.error_code === 4201) { //Cancelled
				//alert('Posting Cancelled.');
			} else {
				alert('Error while posting.');
			}
		  }
		);
	};
	$scope.form.addEmailform = {
		modalTitle: '',
		danger: false,
		success: false,
		qdanger: '',
		atemail: true ,
	};
	$scope.shareEmail = function(node){
		$scope.form.addEmailform.email = '';
		$scope.form.addEmailform.qdanger = 'Rating cannot be processed right now.';
		$scope.form.addEmailform.danger = false;
		$scope.form.addEmailform.success = false;
		$modal.open({
			templateUrl: 'EmailModalContent.html',
			controller: function ($scope, $modalInstance) {
					$scope.ok = function () {
						if($scope.form.addEmailform.processing)
							return;
						$scope.form.addEmailform.atemail = true;
						if( !( typeof $scope.form.addEmailform.email === 'undefined' || $scope.form.addEmailform.email === '' ? false : true ) ){
							$scope.form.addEmailform.atemail = false;return document.getElementById('addEmailform-email').focus();}
						var re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
						if( !re.test($scope.form.addEmailform.email.trim()) ){
							$scope.form.addEmailform.atemail = false;return document.getElementById('addEmailform-email').focus();}
						$scope.form.addEmailform.processing = true;
						var _node = $scope;
						$http({
							method: 'POST',
							url: baseUrl+'teacher/share.json',
							data:{
								teacherId : node.id,
								entity : 'teacher',
								medium : 'email',
								emailAddress : $scope.form.addEmailform.email,
							}
						}).success(function(rdata) {
							_node.form.addEmailform.success = true;
							return $timeout(function(){
								$modalInstance.close();
								_node.form.addEmailform.processing = false;
							}, 1500);
						}).error(function(data, status, headers, config) {console.log(data);
							if(data.status === 422) {
								_node.form.addEmailform.qdanger = 'Email Address Is Not Correct';
							}
							_node.form.addEmailform.processing = false;
							return _node.form.addEmailform.danger = true;
						});
					};
					$scope.cancel = function () {
						$modalInstance.dismiss('cancel');
					};
			},
			size: 'md',
			scope : $scope ,
		});
	};
	$scope.form.addSlider = {
		modalTitle: '',
		danger: false,
		success: false,
		qdanger: '',
		atemail: true ,
	};
	$scope.AddScPhoto = function(){
		//$scope.form.addSlider.file = '';
		$scope.form.addSlider.qdanger = 'Upload Image cannot be processed right now.';
		$scope.form.addSlider.danger = false;
		$scope.form.addSlider.success = false;
		$scope.form.addSlider.atfile = false;
		$modal.open({
			templateUrl: 'AddSliderModalContent.html',
			controller: function ($scope, $modalInstance) {
					$scope.form.addSlider.atfile = false;
					$scope.form.addSlider.file = '';
					angular.element(document.querySelector('#slider_file')).val('');
					$scope.ok = function () {
						$scope.form.addSlider.atfile = false;
						if($scope.form.addSlider.processing)
							return;
						if( typeof $scope.form.addSlider.file === 'undefined' || $scope.form.addSlider.file === null || $scope.form.addSlider.file === '' )
							return $scope.form.addSlider.atfile = 'Image is required';
						if( !$scope.form.addSlider.file.name.match(/\.(jpg|jpeg|png|gif)$/))
							return $scope.form.addSlider.atfile = 'Allow only image (jpg,jpeg,png,gif) ';
						if( $scope.form.addSlider.file.size > 3000000 )
							return $scope.form.addSlider.atfile = 'Image can\'t be more than 3 MB ';


						$scope.form.addSlider.processing = true;
						var _node = $scope;
						Upload.upload({
							method: 'POST',
							url: baseUrl+'image/school.json',
							data:{
								entity : 'school',
								entityId : 1,
								image : $scope.form.addSlider.file,
							},
						}).then(function (resp) {
							_node.form.addSlider.success = true;
							return $timeout(function(){
								$modalInstance.close();
								_node.form.addSlider.processing = false;
							}, 2000);
							/* console.log('Success ' + resp.config.data.file.name + 'uploaded. Response: ' + resp.data); */
						}, function (resp) {
							_node.form.addSlider.processing = false;
							return _node.form.addSlider.danger = true;
							/* console.log('Error status: ' + resp.status); */
						}, function (evt) {
							var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
							console.log('progress: ' + progressPercentage + '% ');
							/* console.log('progress: ' + progressPercentage + '% ' + evt.config.data.file.name); */
						});
					};
					$scope.cancel = function () {
						$modalInstance.dismiss('cancel');
					};
			},
			size: 'md',
			scope : $scope ,
		});
	};

	/* $scope.recaptcha = [];
	$scope.recaptcha.response = null;
	$scope.recaptcha.widgetId = null;
	$scope.recaptcha.model = {
		key: '6LecdA4TAAAAAFu0-MyC287Ti8fziVv_4PXPcOEs',
		key2: '6Letdg4TAAAAAG4708Py5KBuWj-yNCv_owo5HlmQ'
	};
	$scope.recaptcha.setResponse = function (response) {
		//console.info('Response available');
		$scope.recaptcha.response = response;
	};
	$scope.recaptcha.setWidgetId = function (widgetId) {
		console.info('Created widget ID: %s', widgetId);
		$scope.recaptcha.widgetId = widgetId;
	};
	$scope.recaptcha.cbExpiration = function() {
		console.info('Captcha expired. Resetting response object');
		$scope.recaptcha.response = null;
	}; */


	/* question form */
	$scope.form.question = {
		danger: false,
		success: false,
		qdanger: '',
		qsubject: true ,
		qcaptcha: true ,
		processing: false ,
	};

	$scope.form.question.recaptcha = [];
	$scope.form.question.recaptcha.response = null;
	$scope.form.question.recaptcha.widgetId = null;
	$scope.form.question.recaptcha.key = '6Letdg4TAAAAAG4708Py5KBuWj-yNCv_owo5HlmQ';
	$scope.form.question.recaptcha.setResponse = function (response) {
		console.info(response);
		$scope.form.question.recaptcha.response = response;
	};
	$scope.form.question.recaptcha.setWidgetId = function (widgetId) {
		console.log(widgetId);
		$scope.form.question.recaptcha.widgetId = widgetId;
	};
	$scope.form.question.recaptcha.cbExpiration = function() {
		$scope.form.question.recaptcha.response = null;
	};

	$scope.sendQ = function() {
		$scope.form.question.qsubject = true;
		$scope.form.question.qcaptcha = true;
		if( !( typeof $scope.form.question.subject === 'undefined' || $scope.form.question.subject === '' ? false : true ) ){
			$scope.form.question.qsubject = false;
			return document.getElementById('questionForm-subject').focus();
		}
		if( typeof $scope.form.question.recaptcha.response === 'undefined' || $scope.form.question.recaptcha.response === null ){
			return $scope.form.question.qcaptcha = false;
			/* return vcRecaptchaService.reload(1); */
		}
		$scope.form.question.processing = true;
		var _node = $scope;
		$http({
			method: 'POST',
			url: baseUrl+'feedback.json',
			data: {
				content : $scope.form.question.subject ,
				'g-recaptcha-response' : $scope.form.question.recaptcha.response ,
			},
		}).success(function(rdata) {
			_node.form.question.processing = false;
			return _node.form.question.success = true;
		}).error(function(data, status, headers, config) {
			_node.form.question.processing = false;
			_node.form.question.danger = true;
			return _node.form.question.qdanger = 'Send Feedback Question cannot be processed right now';
		});
	};

	/* add teacher form */
	$scope.form.addteacher = {
		danger: false,
		success: false,
		qdanger: '',
		atfirstname: true ,
		atlastname: true ,
		attitle: true ,
		atgradetaught: true ,
		atsubjects: true ,
		atfile: false ,
		qcaptcha: true ,
		processing: false ,
	};

	$scope.form.addteacher.recaptcha = [];
	$scope.form.addteacher.recaptcha.response = null;
	$scope.form.addteacher.recaptcha.widgetId = null;
	$scope.form.addteacher.recaptcha.key = '6LecdA4TAAAAAFu0-MyC287Ti8fziVv_4PXPcOEs';
	$scope.form.addteacher.recaptcha.setResponse = function (response) {
		console.info(response);
		$scope.form.addteacher.recaptcha.response = response;
	};
	$scope.form.addteacher.recaptcha.setWidgetId = function (widgetId) {
		console.log(widgetId);
		$scope.form.addteacher.recaptcha.widgetId = widgetId;
	};
	$scope.form.addteacher.recaptcha.cbExpiration = function() {
		$scope.form.addteacher.recaptcha.response = null;
	};

	$scope.sendAT = function() {
		if($scope.form.addteacher.processing)
			return;

		$scope.form.addteacher.atfirstname = true ;
		$scope.form.addteacher.atlastname = true ;
		$scope.form.addteacher.attitle =true ;
		$scope.form.addteacher.atgradetaught = true ;
		$scope.form.addteacher.atsubjects = true ;
		$scope.form.addteacher.atfile = false ;
		$scope.form.addteacher.qcaptcha = true ;


		if( !( typeof $scope.form.addteacher.firstname === 'undefined' || $scope.form.addteacher.firstname === '' ? false : true ) ){
			$scope.form.addteacher.atfirstname = false;
			return document.getElementById('form.addteacher.firstname').focus();
		}
		if( !( typeof $scope.form.addteacher.lastname === 'undefined' || $scope.form.addteacher.lastname === '' ? false : true ) ){
			$scope.form.addteacher.atlastname = false;
			return document.getElementById('form.addteacher.lastname').focus();
		}
		if( !( typeof $scope.form.addteacher.title === 'undefined' || $scope.form.addteacher.title === '' ? false : true ) ){
			$scope.form.addteacher.attitle = false;
			return document.getElementById('form.addteacher.title').focus();
		}
		if( !( typeof $scope.form.addteacher.gradetaught === 'undefined' || $scope.form.addteacher.gradetaught === '' ? false : true ) ){
			$scope.form.addteacher.atgradetaught = false;
			return document.getElementById('form.addteacher.gradetaught').focus();
		}
		if( !( typeof $scope.form.addteacher.subjects === 'undefined' || $scope.form.addteacher.subjects === '' ? false : true ) ){
			$scope.form.addteacher.atsubjects = false;
			return document.getElementById('form.addteacher.subjects').focus();
		}

		if( typeof $scope.form.addteacher.file === 'undefined' || $scope.form.addteacher.file === null || $scope.form.addteacher.file === '' )
			return $scope.form.addteacher.atfile = 'Image is required';
		if( !$scope.form.addteacher.file.name.match(/\.(jpg|jpeg|png|gif)$/))
			return $scope.form.addteacher.atfile = 'Allow only image (jpg,jpeg,png,gif) ';
		if( $scope.form.addteacher.file.size > 3000000 )
			return $scope.form.addteacher.atfile = 'Image can\'t be more than 3 MB ';

		if( typeof $scope.form.addteacher.recaptcha.response === 'undefined' || $scope.form.addteacher.recaptcha.response === null ){
			return $scope.form.addteacher.qcaptcha = false;
			/* return vcRecaptchaService.reload(0); */
		}
		$scope.form.addteacher.processing = true;
		var _node = $scope;
		Upload.upload({
			method: 'POST',
			url: baseUrl+'teacher.json',
			data : {
				firstName: $scope.form.addteacher.firstname,
				lastName: $scope.form.addteacher.lastname,
				title: $scope.form.addteacher.title,
				grade: $scope.form.addteacher.gradetaught,
				subject: $scope.form.addteacher.subjects,
				image: $scope.form.addteacher.file,
				'g-recaptcha-response' : $scope.form.addteacher.recaptcha.response ,
			},
		}).then(function (resp) {
			_node.form.addteacher.processing = false;
			return _node.form.addteacher.success = true;
		}, function (resp) {
			_node.form.addteacher.processing = false;
			_node.form.addteacher.danger = true;
			return _node.form.addteacher.qdanger = 'Add Teacher cannot be processed right now';
		}, function (evt) {
			var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
			console.log('progress: ' + progressPercentage + '% ');
			/* console.log('progress: ' + progressPercentage + '% ' + evt.config.data.file.name); */
		});

	};

});
