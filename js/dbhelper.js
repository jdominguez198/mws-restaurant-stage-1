/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get API_URL() {
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}/`;
  }

  static get API_RESTAURANTS_URL() {
    return DBHelper.API_URL + 'restaurants/';
  }

  static get API_REVIEWS_URL() {
      return DBHelper.API_URL + 'reviews/';
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {

    // We have to check if we did a previous fetch will the data
    // and if so, do not fetch from network and provide the saved ones

    window.idbKeyval.getAll().then(function(_restaurantsFromStorage) {
        if (_restaurantsFromStorage.length && _restaurantsFromStorage.length > 0) {

            console.log('Retrieving restaurants from indexedDB');
            callback(null, _restaurantsFromStorage);

        } else {

            console.log('Retrieving restaurants from network');
            let xhr = new XMLHttpRequest();
            xhr.open('GET', DBHelper.API_RESTAURANTS_URL);
            xhr.onload = () => {
                if (xhr.status === 200) { // Got a success response from server!
                    const restaurants = JSON.parse(xhr.responseText);

                    let xhrReviews = new XMLHttpRequest();
                    xhrReviews.open('GET', DBHelper.API_REVIEWS_URL);
                    xhrReviews.onload = () => {

                        const restaurantsMap = {};
                        window.idbKeyval.clear();
                        for (let i = 0; i < restaurants.length; i++) {
                            const restaurant = restaurants[i];
                            restaurantsMap[restaurant.id] = i;
                            window.idbKeyval.set(restaurant.id, restaurant);
                            if (typeof restaurant.photograph !== 'undefined') {
                                fetch(`/img/${restaurant.photograph}.webp`);
                            }
                        }

                        const reviews = JSON.parse(xhrReviews.responseText);
                        if (reviews.length && reviews.length > 0) {
                            for (const review of reviews) {

                                if (!restaurants[restaurantsMap[review.restaurant_id]].reviews) {
                                    restaurants[restaurantsMap[review.restaurant_id]].reviews = [];
                                }

                                restaurants[restaurantsMap[review.restaurant_id]].reviews.push(review);
                                window.idbKeyval.set(review.restaurant_id, restaurants[restaurantsMap[review.restaurant_id]]);

                            }
                        }


                        callback(null, restaurants);

                    };
                    xhrReviews.send();

                } else { // Oops!. Got an error from server.
                    const error = (`Request failed. Returned status of ${xhr.status}`);
                    callback(error, null);
                }
            };
            xhr.send();

        }
    });

  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    if (typeof restaurant.photograph !== 'undefined') {
        return (`/img/${restaurant.photograph}.webp`);
    } else {
        return ('/img/img-placeholder.svg');
    }
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    return new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
  }

  static markRestaurantAsFavorite(restaurantID, isFavorite, callback) {

      let xhr = new XMLHttpRequest();
      xhr.open('PUT', DBHelper.API_RESTAURANTS_URL + restaurantID + '/?is_favorite=' + (isFavorite ? 'true' : 'false'));
      xhr.onload = () => {
          if (xhr.status === 200) { // Got a success response from server!
              window.idbKeyval.get(restaurantID).then((restaurant) => {
                  console.log(restaurant);
                  restaurant.is_favorite = "" + isFavorite; // set it as String
                  window.idbKeyval.set(restaurantID, restaurant);
              });
              callback(null, true);
          } else { // Oops!. Got an error from server.
              const error = (`Request failed. Returned status of ${xhr.status}`);
              callback(error, null);
          }
      };
      xhr.send();

  }

  static saveRestaurantReview(data, callback) {

    let xhr = new XMLHttpRequest();
      xhr.open('POST', DBHelper.API_REVIEWS_URL);
      xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
      xhr.onload = () => {
          if (xhr.status === 201) {
            const restaurantID = parseInt(data.restaurant_id);
              window.idbKeyval.get(restaurantID).then((restaurant) => {
                  if (!restaurant.reviews) {
                    restaurant.reviews = [];
                  }
                  restaurant.reviews.push(JSON.parse(xhr.responseText));
                  window.idbKeyval.set(restaurantID, restaurant);
              });
              callback(null, true);
          } else { // Oops!. Got an error from server.
              const error = (`Request failed. Returned status of ${xhr.status}`);
              callback(error, null);
          }
      };
      xhr.send(serialize(data));

  }

}

const serialize = function(obj) {
    const str = [];
    for (let p in obj)
        if (obj.hasOwnProperty(p)) {
            str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
        }
    return str.join("&");
};
