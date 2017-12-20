

var api = 'https://viniciusofp.com.br/wp-json/wp/v2/'
var app = angular.module('app', ['ngRoute', 'ngResource', 'ngSanitize']);

app.filter('toTrusted', function ($sce) {
    return function (value) {
        return $sce.trustAsHtml(value);
    };
})

app.config(function($routeProvider, $locationProvider) {
  $routeProvider
   .when('/', {
    templateUrl: './postlist.html',
    controller: 'Home',
  })
   .when('/cat/:slug/:id', {
    templateUrl: './postlist.html',
    controller: 'Cat'
  })
   .when('/tag/:slug/:id', {
    templateUrl: './postlist.html',
    controller: 'Tag'
  })
   .when('/post/:slug', {
    templateUrl: './singlepost.html',
    controller: 'Post'
  })
})

app.factory('wp', ['$q', '$resource', function($q, $resource) {
  wp = []
  wp.queryPosts = function() {
    var results = [];
    var queryPosts = $resource( api+ 'posts?per_page=50' ).query()
    $q.all([
        queryPosts.$promise,
    ]).then( function (data) {
      data[0].forEach(function(thePost) {
        var media = $resource(api + "media/:theMediaId", {theMediaId: thePost.featured_media}).get();
        $q.all([
            media.$promise,
        ]).then( function (data) {
          thePost.img = data[0].media_details.sizes;
        });
      });
      Array.prototype.push.apply(results, data[0]);
    });
    return results
  }
  wp.queryTags = function() {
    var results = [];
    var queryPosts = $resource( api+ 'tags?per_page=50' ).query()
    $q.all([
        queryPosts.$promise,
    ]).then( function (data) {
      data[0] = data[0].filter(function(e) {
        return e.count !== 0
      })
      for (var i = data[0].length - 1; i >= 0; i--) {
        var tagPosts = [];
        var queryPosts = $resource(api + 'posts?tags=:tagid', {tagid: data[0][i].id}).query();
        $q.all([
            queryPosts.$promise,
        ]).then( function (data) {
          Array.prototype.push.apply(tagPosts, data[0]);
        });
        data[0][i].posts = tagPosts;
      }
      Array.prototype.push.apply(results, data[0]);
    });
    return results
  }
  wp.getTag = function(slug) {
    var results = [];
    var tagPosts = []
    var query = $resource( api+ 'tags?slug=:slug&per_page=50', {slug: slug} ).query()
    $q.all([
        query.$promise,
    ]).then( function (data) {
      var queryPosts = $resource(api + 'posts?tags=:tagid', {tagid: data[0][0].id}).query();
      $q.all([
          queryPosts.$promise,
      ]).then( function (data) {
        Array.prototype.push.apply(tagPosts, data[0]);
      });
      data[0][0].posts = tagPosts;
      Array.prototype.push.apply(results, data[0]);
    });
    return results
  }
  wp.queryCategories = function() {
    var results = [];
    var queryPosts = $resource( api+ 'categories?per_page=50' ).query()
    $q.all([
        queryPosts.$promise,
    ]).then( function (data) {
      data[0] = data[0].filter(function(e) {
        return e.slug !== 'sem-categoria'
      })
      Array.prototype.push.apply(results, data[0]);
    });
    return results
  }
  wp.getCategory = function(slug) {
    var results = [];
    var catPosts = []
    var queryPosts = $resource( api+ 'categories?slug=:slug&per_page=50', {slug: slug} ).query()
    $q.all([
        queryPosts.$promise,
    ]).then( function (data) {
      var queryPosts = $resource(api + 'posts?categories=:catid', {catid: data[0][0].id}).query();
      $q.all([
          queryPosts.$promise,
      ]).then( function (data) {
        Array.prototype.push.apply(catPosts, data[0]);
      });
      data[0][0].posts = catPosts;
      Array.prototype.push.apply(results, data[0]);
    });
    return results
  }
  return wp

}])

app.controller('Ctrl', ['$scope', 'wp', function($scope, wp) {
  $scope.allPosts = wp.queryPosts();
  $scope.posts = $scope.allPosts;
  $scope.tags = wp.queryTags();
  $scope.categories = wp.queryCategories();

  var setTags = function() {
    $scope.posts.forEach(function(post) {
      var tagsArray = []
      post.tags.forEach(function(tag) {
        var postTag = $scope.tags.filter(function(e) {
          return e.id == tag
        })
        tagsArray.push(postTag[0])
      })
      post.tagObjs = tagsArray;
    })
  }
  if ($scope.posts.length > 0) {
    setTags();
  } else {
    setTimeout(function(){
      if ($scope.posts.length > 0) {
        setTags();
      } else {
        if ($scope.posts.length > 0) {
          setTags();
        } else {
          setTimeout(function(){
          setTags();
          },3000)
        }
      }
    },1500)
  }

  function findPos(obj) {
    var curtop = 0;
    if (obj.offsetParent) {
        do {
            curtop += obj.offsetTop;
        } while (obj = obj.offsetParent);
    return [curtop];
    }
  }
  $scope.scrollTop = function() {
    window.scroll(0,findPos(document.getElementById("posttop")));
  }
  $scope.scrollMenu = function() {
    window.scroll(0,findPos(document.getElementById("menutop")));
    window.history.back();
  }

  $scope.activateTag = function($event) {
    $('li').removeClass('active-tag');
    $($event.currentTarget).addClass('active-tag')
    console.log( $($event.currentTarget).children('li'))

  }

}])
app.controller('Home', ['$scope', 'wp', function($scope, wp) {
  $scope.posts = $scope.allPosts
}])
app.controller('Cat', ['$scope', 'wp', '$routeParams', function($scope, wp, $routeParams) {
  $scope.section = wp.getCategory($routeParams.slug);
  var setPosts = function() {
    var catPosts = []
    $scope.posts.forEach(function(e) {
      e.categories.forEach(function(category) {
        if (category == $routeParams.id) {
          catPosts.push(e)
        }
      })
    })
    $scope.posts = catPosts
  }
  if ($scope.posts.length > 0) {
    setPosts();
  } else {
    setTimeout(function(){
      if ($scope.posts.length > 0) {
        setPosts();
      } else {
        if ($scope.posts.length > 0) {
          setPosts();
        } else {
          setTimeout(function(){
          setPosts();
          },3000)
        }
      }
    },1500)
  }
}])
app.controller('Tag', ['$scope', 'wp', '$routeParams', function($scope, wp, $routeParams) {
  $scope.title = $routeParams.slug
  $scope.section = wp.getTag($routeParams.slug);
  var setPosts = function() {
    var tagPosts = []
    $scope.posts.forEach(function(e) {
      e.tags.forEach(function(tag) {
        if (tag == $routeParams.id) {
          tagPosts.push(e)
        }
      })
    })
    $scope.posts = tagPosts
  }

  if ($scope.posts.length > 0) {
    setPosts();
  } else {
    setTimeout(function(){
      if ($scope.posts.length > 0) {
        setPosts();
      } else {
        if ($scope.posts.length > 0) {
          setPosts();
        } else {
          setTimeout(function(){
          setPosts();
          },3000)
        }
      }
    },1500)
  }
}])

app.controller('Post', ['$scope', 'wp', '$routeParams', function($scope, wp, $routeParams) {
  var setPost = function() {
    var post = []
    $scope.posts.forEach(function(e) {
      if (e.slug == $routeParams.slug) {
        post.push(e)
      }
    })
    $scope.post = post[0]
  }

  if ($scope.posts.length > 0) {
    setPost();
  } else {
    setTimeout(function(){
      if ($scope.posts.length > 0) {
        setPost();
      } else {
        if ($scope.posts.length > 0) {
          setPost();
        } else {
          setTimeout(function(){
          setPost();
          },3000)
        }
      }
    },1500)
  }
}])
