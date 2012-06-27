var Devclub = {
    Routers: [],
    Views: [],
    Collections: [],
    Models: []
};
$(document).ready(function () {
/*
    Devclub.Routers.Main = Backbone.Router.extend({
        routes: {
            "": "void",
            "add_story": "add_story"
        },
        void: function () {
        },

        add_story: function () {
            alert(1);
        }
    });*/

    Devclub.Models.Story = Backbone.Model.extend({
        url: function () {
            return sys_url + 'story/' + (this.isNew() ? '' : this.id);
        }
    });

    //Collections
    Devclub.Collections.CurrentStories = Backbone.Collection.extend({
        url: function () {
            return sys_url + 'list_current_stories/';
        }
    });

    Devclub.Collections.BacklogStories = Backbone.Collection.extend({
        url: function () {
            return sys_url + 'list_backlog_stories/';
        }
    });

    Devclub.Collections.IceboxStories = Backbone.Collection.extend({
        url: function () {
            return sys_url + 'list_icebox_stories/';
        }
    });

    //Views
    Devclub.Views.AddForm = Backbone.View.extend({
        el: '#story_form',
        events: {
            "click .btn": 'submit',
            "click .btn-cancel": 'reset'
        },

        modelID: null,

        edit: function(m){
            $('.btn-primary', this.el).html('Save');
            $('.btn-cancel', this.el).show();
            $('input[name=title]', this.el).val(m.get('title'));
            $('input[name=authors]', this.el).val(m.get('authors'));
            $('textarea', this.el).val(m.get('description'));
            this.modelID = m.get('ID');
        },

        reset: function(){
            $(this.el).each(function () {
                this.reset();
            });

            $('.btn-cancel', this.el).hide();
            $('.btn-primary', this.el).html('Add story');
            this.id = null;
        },

        submit: function () {

            if($('input[name=title]', this.el).val().length<2){
                $('.alert-error p').html('Make up a title for your story');
                $('.alert-error').slideDown();
                return false;
            }
            if($('input[name=authors]', this.el).val().length<2){
                $('.alert-error p').html('Introduce yourself.. or whoever is going to talk');
                $('.alert-error').slideDown();
                return false;
            }

            $('.alert-error', this.el).hide();

            var m = new Devclub.Models.Story();
            var view = this;

            var data = {
                            'title': $('input[name=title]', this.el).val(),
                            'authors': $('input[name=authors]', this.el).val(),
                            'description': $('textarea:first', this.el).val(),
                            'duration': $('select', this.el).val()
                        };

            if(this.modelID){
                data.id = this.modelID;
            }

            m.save(data, {
                success: function(model){
                    model = new Devclub.Models.Story(model);
                    model.set({
                        owner: true,
                        voted: 0,
                        votes: '',
                        rate: ''
                    });

                    var row = new Devclub.Views.Story({model: model});
                    $('#icebox').append(row.render().el);

                    view.reset();
                }
            });

        }
    });

    Devclub.Views.StoriesList = Backbone.View.extend({
        initialize: function () {
            this.collection.bind('reset', this.reset, this);
            this.collection.fetch();
        },

        reset: function (modelList) {
            $(this.el).html('');
            var me = this;

            $.each(modelList.models, function (i, model) {
                me.add(model);
            });

            $('*[rel=tooltip]', this.el).tooltip();

			if($('#mail').text()!=''){
				$('.vote').show();
			}
        },

        add: function (model) {
            var contact_model = new Devclub.Models.Story(model);
            var view = new Devclub.Views.Story({
                model: contact_model
            });

            var html = view.render().el;

            $(this.el).append(html);

//       		view.bind('selected', this.onPersonSelected, this);
//       		view.bind('deselected', this.onPersonDeselected, this);
        }
    });

    Devclub.Views.CurrentStoriesList = Devclub.Views.StoriesList.extend({
        el: '#current'
    });

    Devclub.Views.BacklogStoriesList = Devclub.Views.StoriesList.extend({
        el: '#backlog'
    });

    Devclub.Views.IceboxStoriesList = Devclub.Views.StoriesList.extend({
        el: '#icebox'
    });

    Devclub.Views.Story = Backbone.View.extend({
        tagName: 'li',
        template: _.template($("#story_item_template").html()),
        events: {
            'click .icon-pencil': 'edit',
            'click .close': 'deleteStory',
            'click': 'slide',
            'click .vote': 'vote'
        },

        slide: function(){
          $('.extra',this.el).slideToggle();
        },

		deleteStory: function(){
            var view = this;
            $.get(sys_url + 'devclub/delete_story/'+this.model.get('ID'),function(){
                view.remove();
            });
        },


		vote: function(){
		   this.model.save({
				   'position': 0
			   },{
			   complete: function(model, response){
				   Devclub.iceboxStoriesListView.collection.fetch();
			   }
		   });
			return false;
		},

        edit: function(){
            Devclub.addView.edit(this.model);
            return false;
        },

        render: function () {
            var tplvars = this.model.toJSON();

            if(tplvars.creator_email == $('#mail').text()){
                tplvars.owner=true;
            }

            if(tplvars.description!=null){
                tplvars.description = tplvars.description.replace(/\n/g,'<br />');
            }

            var html = this.template(tplvars);

			$(this.el).html(html);

            if(this.model.get('voted')>0){
                $(this.el).addClass('voted');
            }

            $(this.el).data('sid', this.model.get('ID'));
            return this;
        }
    });

    //Devclub.router = new Devclub.Routers.Main();
    Devclub.addView = new Devclub.Views.AddForm();

    Devclub.currentStoriesListView = new Devclub.Views.CurrentStoriesList({
        collection: new Devclub.Collections.CurrentStories()
    });

    Devclub.backlogStoriesListView = new Devclub.Views.BacklogStoriesList({
        collection: new Devclub.Collections.BacklogStories()
    });

    Devclub.iceboxStoriesListView = new Devclub.Views.IceboxStoriesList({
        collection: new Devclub.Collections.IceboxStories()
    });

    //Backbone.history.start();

    $('.login').click(function () {
        navigator.id.get(function (assertion) {
            // got an assertion, now send it up to the server for verification
            if (assertion !== null) {
                $.ajax({
                    type: 'POST',
                    dataType: 'json',

                    url: sys_url + 'devclub/login/',
                    data: { assertion: assertion },
                    success: function (res, status, xhr) {

                        if (res === null) {
                        }//loggedOut();
                        else {
                            $('.vote').show();
                            $('.login').hide();
                            $('.login').parents('.alert:first').hide();
                            $('#story_form').show();
                            $('#logout').show();
                            $('#mail').html(res.email);

                            Devclub.iceboxStoriesListView.collection.fetch();

                            makeSortable();
                            //loggedIn(res);
                        }
                    },
                    error: function (res, status, xhr) {
                        alert("login failure" + res);
                    }
                });
            } else {
                //loggedOut();
            }

        });
        return false;
    });

    $('#logout').click(function(){
        navigator.id.logout();
        $.get(sys_url + 'devclub/logout/', function(){
            window.location.reload();
        });

    });


    function makeSortable(){
        var opt = {

            stop: function (event, ui) {
                //$(ui.item).parent().attr('id');
                var model = new Devclub.Models.Story({
                    id: $(ui.item).data('sid')
                });
                model.fetch();

                model.save({
                        'status': $(ui.item).parent().attr('id'),
                        'position': $(ui.item).index()
                    },{
                    complete: function(model, response){
                        Devclub.iceboxStoriesListView.collection.fetch();
                    }
                });


            }
        };

        if($('#mail').html() == 'artkurapov@gmail.com'){
            opt.connectWith = ".sortable";
        }
        $('.row-fluid ul').sortable(opt).disableSelection();
    }


    $( "#story_form input[name=authors]" ).autocomplete({
        source: sys_url+"devclub/author_list",
        minLength: 2,
        select: function( event, ui ) {
        }
    });

    if($('#mail').text()!=''){
		makeSortable();
    }

});