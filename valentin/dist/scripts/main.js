!function(root, factory) {
    "function" == typeof define && define.amd ? // AMD. Register as an anonymous module unless amdModuleId is set
    define([], function() {
        return root.svg4everybody = factory();
    }) : "object" == typeof exports ? module.exports = factory() : root.svg4everybody = factory();
}(this, function() {
    /*! svg4everybody v2.0.3 | github.com/jonathantneal/svg4everybody */
    function embed(svg, target) {
        // if the target exists
        if (target) {
            // create a document fragment to hold the contents of the target
            var fragment = document.createDocumentFragment(), viewBox = !svg.getAttribute("viewBox") && target.getAttribute("viewBox");
            // conditionally set the viewBox on the svg
            viewBox && svg.setAttribute("viewBox", viewBox);
            // copy the contents of the clone into the fragment
            for (// clone the target
            var clone = target.cloneNode(!0); clone.childNodes.length; ) {
                fragment.appendChild(clone.firstChild);
            }
            // append the fragment into the svg
            svg.appendChild(fragment);
        }
    }
    function loadreadystatechange(xhr) {
        // listen to changes in the request
        xhr.onreadystatechange = function() {
            // if the request is ready
            if (4 === xhr.readyState) {
                // get the cached html document
                var cachedDocument = xhr._cachedDocument;
                // ensure the cached html document based on the xhr response
                cachedDocument || (cachedDocument = xhr._cachedDocument = document.implementation.createHTMLDocument(""),
                cachedDocument.body.innerHTML = xhr.responseText, xhr._cachedTarget = {}), // clear the xhr embeds list and embed each item
                xhr._embeds.splice(0).map(function(item) {
                    // get the cached target
                    var target = xhr._cachedTarget[item.id];
                    // ensure the cached target
                    target || (target = xhr._cachedTarget[item.id] = cachedDocument.getElementById(item.id)),
                    // embed the target into the svg
                    embed(item.svg, target);
                });
            }
        }, // test the ready state change immediately
        xhr.onreadystatechange();
    }
    function svg4everybody(rawopts) {
        function oninterval() {
            // while the index exists in the live <use> collection
            for (// get the cached <use> index
            var index = 0; index < uses.length; ) {
                // get the current <use>
                var use = uses[index], svg = use.parentNode;
                if (svg && /svg/i.test(svg.nodeName)) {
                    var src = use.getAttribute("xlink:href");
                    if (polyfill && (!opts.validate || opts.validate(src, svg, use))) {
                        // remove the <use> element
                        svg.removeChild(use);
                        // parse the src and get the url and id
                        var srcSplit = src.split("#"), url = srcSplit.shift(), id = srcSplit.join("#");
                        // if the link is external
                        if (url.length) {
                            // get the cached xhr request
                            var xhr = requests[url];
                            // ensure the xhr request exists
                            xhr || (xhr = requests[url] = new XMLHttpRequest(), xhr.open("GET", url), xhr.send(),
                            xhr._embeds = []), // add the svg and id as an item to the xhr embeds list
                            xhr._embeds.push({
                                svg: svg,
                                id: id
                            }), // prepare the xhr ready state change event
                            loadreadystatechange(xhr);
                        } else {
                            // embed the local id into the svg
                            embed(svg, document.getElementById(id));
                        }
                    }
                } else {
                    // increase the index when the previous value was not "valid"
                    ++index;
                }
            }
            // continue the interval
            requestAnimationFrame(oninterval, 67);
        }
        var polyfill, opts = Object(rawopts), newerIEUA = /\bTrident\/[567]\b|\bMSIE (?:9|10)\.0\b/, webkitUA = /\bAppleWebKit\/(\d+)\b/, olderEdgeUA = /\bEdge\/12\.(\d+)\b/;
        polyfill = "polyfill" in opts ? opts.polyfill : newerIEUA.test(navigator.userAgent) || (navigator.userAgent.match(olderEdgeUA) || [])[1] < 10547 || (navigator.userAgent.match(webkitUA) || [])[1] < 537;
        // create xhr requests object
        var requests = {}, requestAnimationFrame = window.requestAnimationFrame || setTimeout, uses = document.getElementsByTagName("use");
        // conditionally start the interval if the polyfill is active
        polyfill && oninterval();
    }
    return svg4everybody;
});

(function(){
  "use strict";
  svg4everybody();

  $(".js-scroll-to").on('click', function(e) {
    var destination = $($(this).attr('data-scroll-to'));
    if (destination.length) {
      e.preventDefault();
      $('html, body').animate({
        scrollTop: destination.offset().top
      }, 600);
    }
  });

  $(document).on('focusout input', '[required]', function(){
    var field = $(this);
    if( !field.val() ) {
      if ( !field.siblings('.errors').length ) {
        field.after('<ul class="errors"><li>This field cannot be blank</li></ul>');
      }
    } else {
      field.siblings('.errors').remove();
    }
  });

  $(document).on('focusout', '[type=email]', function(){
    var field = $(this);
    var email = field.val();
    if( !/^([a-z0-9._-]+)@([a-z0-9._-]+)\.([a-z]+)$/.test(email) ) {
      if ( !field.siblings('.errors').length ) {
        field.after('<ul class="errors"><li>This is not a valid email</li></ul>');
      }
    } else {
      field.siblings('.errors').remove();
    }
  });

  $(document).on('input', '[type=email]', function(){
    var field = $(this);
    var email = field.val();
    if( /^([a-z0-9._-]+)@([a-z0-9._-]+)\.([a-z]+)$/.test(email) ) {
      field.siblings('.errors').remove();
    }
  });

  $('#contact-form').on('submit', function(e) {
    // Prevent the form from actually submitting
    e.preventDefault();
    var form = $(this),
        name = form.find('#fromName').val(),
        data = form.serialize();

    // Send it to the server
    $.post('/', data, function(response) {
      if (response.success) {
        form.find('#message').val('');
        $('.snackbar').find('.snackbar__content').text('Thank you ' + name + '! Your message has been sent.');
        showSnackbar();
      } else {
        // response.error will be an object containing any validation errors that occurred, indexed by field name
        // e.g. response.error.fromName => ['From Name is required']
        $('.snackbar').find('.snackbar__content').text('An error occured. Please try again.');
        showSnackbar(true);
        $('.form__field').each(function() {
          var field = $(this);
          if (field.attr('required')) {
            if( !field.val() ) {
              if ( !field.siblings('.errors').length ) {
                field.after('<ul class="errors"><li>This field cannot be blank</li></ul>');
              }
            }
          } else if (field.attr('type') === 'email' ) {
            var email = field.val();
            if( !/^([a-z0-9._-]+)@([a-z0-9._-]+)\.([a-z]+)$/.test(email) ) {
              if ( !field.siblings('.errors').length ) {
                field.after('<ul class="errors"><li>This is not a valid email</li></ul>');
              }
            }
          }
        });
      }
    });
  });

  $('.snackbar__action').on('click', function() {
    hideSnackbar();
  });

  var snackbar = $('.snackbar');

  var showSnackbar = function(error) {
    var snackbarHeight = snackbar.height() + 'px';
    snackbar.removeClass('snackbar--error');
    if (error) {
      snackbar.addClass('snackbar--error');
    }
    snackbar.addClass('is-shown');
    $('.content').css({ 'padding-bottom': snackbarHeight });
    setTimeout(
      function() {
        hideSnackbar();
      },
      5000
    );
  };

  var hideSnackbar = function() {
    $('.content').css({ 'padding-bottom': 0 });
    snackbar.removeClass('is-shown');
  };

})();
