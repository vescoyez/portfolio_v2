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
  var timer = 0;

  var showSnackbar = function(error) {
    var snackbarHeight = snackbar.height() + 'px';
    snackbar.removeClass('snackbar--error');
    if (error) {
      snackbar.addClass('snackbar--error');
    }
    snackbar.addClass('is-shown');
    $('.content').css({ 'padding-bottom': snackbarHeight });
    timer = setTimeout(
      function() {
        hideSnackbar();
      },
      5000
    );
  };

  var hideSnackbar = function() {
    $('.content').css({ 'padding-bottom': 0 });
    snackbar.removeClass('is-shown');
    if (timer) {
      clearTimeout(timer);
      timer = 0;
    }
  };

})();
