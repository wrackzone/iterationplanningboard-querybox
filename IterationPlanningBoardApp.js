(function() {
    var Ext = window.Ext4 || window.Ext;

    Ext.define('Rally.apps.iterationplanningboard.IterationPlanningBoardApp', {
        extend: 'Rally.app.App',
        requires: [
            'Rally.ui.gridboard.planning.TimeboxGridBoard',
            'Rally.ui.gridboard.plugin.GridBoardAddNew',
            'Rally.ui.gridboard.plugin.GridBoardManageIterations',
            'Rally.ui.gridboard.plugin.GridBoardCustomFilterControl'
        ],
        mixins: ['Rally.app.CardFieldSelectable'],
        modelNames: ['User Story', 'Defect'],
        helpId: 272,
        config: {
            defaultSettings: {
                cardFields: 'Parent,Tasks,Defects,Discussion,PlanEstimate',
                queryText : ''
            }
        },

        _querySet : function() {
            var queryText = this.getSetting("queryText");
            return ( !_.isUndefined(queryText) && !_.isNull(queryText) && queryText !== '');
        },

        launch: function() {
            var context = this.getContext(),
                plugins = [
                {
                    ptype: 'rallygridboardaddnew',
                    rankScope: 'BACKLOG',
                    addNewControlConfig: {
                        stateful: true,
                        stateId: context.getScopedStateId('iteration-planning-add-new')
                    }
                },
                {
                    ptype: 'rallygridboardcustomfiltercontrol',
                    filterControlConfig: {
                        margin: '3 9 3 30',
                        blackListFields: ['Iteration', 'PortfolioItem'],
                        modelNames: this.modelNames,
                        stateful: true,
                        stateId: context.getScopedStateId('iteration-planning-custom-filter-button')
                    },
                    showOwnerFilter: true,
                    ownerFilterControlConfig: {
                        stateful: true,
                        stateId: context.getScopedStateId('iteration-planning-owner-filter')
                    }
                }
            ];

            if (context.getSubscription().isHsEdition() || context.getSubscription().isExpressEdition()) {
                plugins.push('rallygridboardmanageiterations');
            }

            var filters = [];
            if (this._querySet()) {
                var queryText = this.getSetting("queryText");
                console.log("Query:",queryText);
                filters.push( Ext.create('TSStringFilter',{query_string: queryText }));
                console.log("Filters:",filters);
            }

            this.gridboard = this.add({
                xtype: 'rallytimeboxgridboard',
                context: context,
                modelNames: this.modelNames,
                timeboxType: 'Iteration',
                plugins: plugins,
                cardBoardConfig: {
                    storeConfig : {
                        filters: filters
                    },
                    cardConfig: {
                        fields:  this.getCardFieldNames()
                    },
                    columnConfig: {
                        additionalFetchFields: ['PortfolioItem']
                    },
                    listeners: {
                        filter: this._onBoardFilter,
                        filtercomplete: this._onBoardFilterComplete,
                        scope: this
                    }
                },
                listeners: {
                    load: this._onLoad,
                    toggle: this._publishContentUpdated,
                    recordupdate: this._publishContentUpdatedNoDashboardLayout,
                    recordcreate: this._publishContentUpdatedNoDashboardLayout,
                    preferencesaved: this._publishPreferenceSaved,
                    scope: this
                }
            });
        },

        getSettingsFields: function () {
            var fields = this.callParent(arguments);
            this.appendCardFieldPickerSetting(fields);

            fields.push(
                {
                    name: 'queryText',
                    xtype:'textareafield',
                    grow: true,
                    width : 400,
                    // boxLabelAlign: 'after',
                    fieldLabel: 'Query'
                    // margin: '0 0 15 50',
                    // labelStyle : "width:100px;"
                    
                }
            );

            return fields;
        },

        _onLoad: function() {
            this._publishContentUpdated();
            if (Rally.BrowserTest) {
                Rally.BrowserTest.publishComponentReady(this);
            }
        },

        _onBoardFilter: function() {
           this.setLoading(true);
        },

        _onBoardFilterComplete: function() {
           this.setLoading(false);
        },

        _publishContentUpdated: function() {
            this.fireEvent('contentupdated');
        },

        _publishContentUpdatedNoDashboardLayout: function() {
            this.fireEvent('contentupdated', {dashboardLayout: false});
        },

        _publishPreferenceSaved: function(record) {
            this.fireEvent('preferencesaved', record);
        }
    });
})();
