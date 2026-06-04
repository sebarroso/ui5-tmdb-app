sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], function (Controller, JSONModel, MessageToast) {
    "use strict";

    // var API_KEY  = "026ba74f5540119add46cac794f83b96";
    // var API_BASE = "https://api.themoviedb.org/3";
    var API_KEY  = window.APP_CONFIG.TMDB_API_KEY;
    var API_BASE = window.APP_CONFIG.TMDB_API_BASE;

    return Controller.extend("demo.tmdb.controller.Main", {

        onInit: function () {
            this.getView().setModel(new JSONModel({
                busy          : false,
                statusMessage : "",
                showPaging    : false,
                currentPage   : 1,
                totalPages    : 1
            }), "appState");

            this.getView().setModel(new JSONModel({ results: [] }), "movies");
        },

        onSearch: function () {
            var sQuery = this.byId("searchField").getValue().trim();
            if (!sQuery) {
                MessageToast.show("Ingresá un título para buscar");
                return;
            }
            this.getView().getModel("appState").setProperty("/currentPage", 1);
            this._doSearch(sQuery, 1);
        },

        onNextPage: function () {
            var oState   = this.getView().getModel("appState");
            var nCurrent = oState.getProperty("/currentPage");
            var nTotal   = oState.getProperty("/totalPages");
            if (nCurrent < nTotal) {
                oState.setProperty("/currentPage", nCurrent + 1);
                this._doSearch(this.byId("searchField").getValue().trim(), nCurrent + 1);
            }
        },

        onPrevPage: function () {
            var oState   = this.getView().getModel("appState");
            var nCurrent = oState.getProperty("/currentPage");
            if (nCurrent > 1) {
                oState.setProperty("/currentPage", nCurrent - 1);
                this._doSearch(this.byId("searchField").getValue().trim(), nCurrent - 1);
            }
        },

        onMovieSelect: function (oEvent) {
            var oItem    = oEvent.getParameter("listItem");
            var oContext = oItem.getBindingContext("movies");
            var nId      = oContext.getProperty("id");

            this.getOwnerComponent().getRouter().navTo("RouteDetalle", {
                movieId: nId
            });
        },

        _doSearch: function (sQuery, nPage) {
            

            var oAppState = this.getView().getModel("appState");
            var oMovies   = this.getView().getModel("movies");

            oAppState.setProperty("/busy", true);
            oAppState.setProperty("/statusMessage", "");
            oAppState.setProperty("/showPaging", false);
            oMovies.setProperty("/results", []);

            // var sUrl = API_BASE
            //     + "/search/movie"
            //     + "?query=" + encodeURIComponent(sQuery)
            //     + "&language=es-AR"
            //     + "&page=" + nPage;
            var sUrl = API_BASE
            + "/search/movie"
            + "?api_key=" + API_KEY
            + "&query=" + encodeURIComponent(sQuery)
            + "&language=es-AR"
            + "&page=" + nPage;

            // fetch(sUrl, {
            //     headers: {
            //         "Authorization": "Bearer " + BEARER_TOKEN,
            //         "Content-Type": "application/json"
            //     }
            // })
            fetch(sUrl)
            .then(function (oResponse) {
                if (!oResponse.ok) throw new Error("HTTP " + oResponse.status);
                return oResponse.json();
            })
            .then(function (oData) {
                var nTotal = oData.total_pages || 1;
                oMovies.setData(oData);
                oAppState.setProperty("/totalPages", nTotal);
                oAppState.setProperty("/showPaging", nTotal > 1);
                oAppState.setProperty("/statusMessage",
                    oData.total_results > 0
                        ? oData.total_results + " resultado(s) encontrado(s)"
                        : "No se encontraron películas para \"" + sQuery + "\""
                );
            })
            .catch(function (oError) {
                oAppState.setProperty("/statusMessage", "Error al consultar TMDB: " + oError.message);
                console.error("Error TMDB:", oError);
            })
            .finally(function () {
                oAppState.setProperty("/busy", false);
            });
        }
    });
});