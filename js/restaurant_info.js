let restaurant;
var map;

// Load service worker
if ( 'serviceWorker' in navigator ) {
    window.addEventListener('load', function() {
        navigator
            .serviceWorker
            .register('/sw.js')
            .then(function(registration) {
                console.log('Service Worker registration successful with scope: ', registration.scope);
                new LazyLoad();
            })
            .catch(function (err) {
                console.log('Service Worker Failed to Register', err);
            });
    });
}

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
};

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant);
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    const error = 'No restaurant id in URL';
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  const icons = name.getElementsByTagName('i');
  const icon = document.createElement('i');
  icon.innerHTML = icons[0].innerHTML;
  icon.className = 'icon icon-favorite' + (restaurant.is_favorite === "true" ? ' full' : '');
  icon.addEventListener('click', toggleFavoriteRestaurant);

  name.innerHTML = restaurant.name;
  name.setAttribute('data-idx', restaurant.id);
  name.appendChild(icon);

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img';
  image.setAttribute('alt', 'Restaurant ' + restaurant.name);
  image.setAttribute('title', 'Restaurant ' + restaurant.name);
  image.setAttribute('data-src', image.src);
  image.setAttribute('data-idx', restaurant.id);
  image.src = DBHelper.imageUrlForRestaurant(restaurant);

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
};

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');
  const box = container.getElementsByClassName('reviews-container-box');
  const title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  box[0].appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    box[0].appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  box[0].appendChild(ul);
};

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');

  const divHeader = document.createElement('div');
  divHeader.className = 'reviews-item-header';
  li.appendChild(divHeader);

  const name = document.createElement('span');
  name.innerHTML = review.name;
  name.className = 'name';
  divHeader.appendChild(name);

  const reviewDate = new Date(review.updatedAt);
  const date = document.createElement('span');
  date.innerHTML = reviewDate.getFullYear() + "-" + (reviewDate.getMonth() + 1) + "-" + reviewDate.getDate();
  date.className = 'date';
  divHeader.appendChild(date);

  const divBody = document.createElement('div');
  divBody.className = 'reviews-item-body';
  li.appendChild(divBody);

  const rating = document.createElement('span');
  rating.innerHTML = `Rating: ${review.rating}`;
  rating.className = 'rating';
  divBody.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  divBody.appendChild(comments);

  return li;
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  li.setAttribute('aria-current', 'page');
  breadcrumb.appendChild(li);
};

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
};

/**
 * Toggle restaurant favorite
 */
toggleFavoriteRestaurant = (e) => {

    const el = e.target;
    const id = parseInt(el.parentNode.getAttribute('data-idx'));
    if (el.className.indexOf('full') !== -1) {
        DBHelper.markRestaurantAsFavorite(id, false, function(error, success) {
            if (success) {
                el.className = el.className.replace('full', '');
            }
        });
    } else {

        DBHelper.markRestaurantAsFavorite(id, true, function(error, success) {
            if (success) {
                el.className = el.className + ' full';
            }
        });
    }

};

// Load when scripts is added
(function() {

  new ReviewModal(getParameterByName('id'));

}());