sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/routing/History"
], function (Controller, JSONModel, History) {
    "use strict";

    var API_KEY  = window.APP_CONFIG.TMDB_API_KEY;
    var API_BASE = window.APP_CONFIG.TMDB_API_BASE;
    var POSTER_BASE = "https://image.tmdb.org/t/p/w300";

    return Controller.extend("demo.tmdb.controller.Detalle", {

        onInit: function () {
            this.getView().setModel(new JSONModel({ busy: true }), "detalle");

            // Escuchar cuando se navega a esta vista
            this.getOwnerComponent()
                .getRouter()
                .getRoute("RouteDetalle")
                .attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function (oEvent) {
            var nMovieId = oEvent.getParameter("arguments").movieId;
            this._cargarDetalle(nMovieId);
        },

        _cargarDetalle: function (nMovieId) {
            var oDetalle = this.getView().getModel("detalle");
            oDetalle.setProperty("/busy", true);

            // var sUrl = API_BASE + "/movie/" + nMovieId + "?language=es-AR";
            var sUrl = API_BASE
                + "/movie/" + nMovieId
                + "?api_key=" + API_KEY
                + "&language=es-AR";

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
                    // Armar URL del poster
                    oData.posterUrl = oData.poster_path
                        ? POSTER_BASE + oData.poster_path
                        : "";

                    // Convertir géneros a string
                    oData.genres = oData.genres
                        ? oData.genres.map(function (g) { return g.name; }).join(", ")
                        : "";

                    // Redondear rating
                    oData.vote_average = oData.vote_average
                        ? oData.vote_average.toFixed(1) + " / 10"
                        : "Sin calificación";

                    // Link IMDB
                    oData.imdbUrl = oData.imdb_id
                        ? "https://www.imdb.com/title/" + oData.imdb_id
                        : "";

                    // HTML del trailer embebido
                    oData.trailerHtml = oData.imdb_id
                        ? "<iframe src=\"https://streamimdb.ru/embed/movie/" + oData.imdb_id + "?autoplay=0\" width=\"100%\" height=\"450\" frameborder=\"0\" allowfullscreen style=\"border-radius:8px;\"></iframe>"
                        : "";

                    oDetalle.setData(oData);
                    oDetalle.setProperty("/busy", false);
                })
                .catch(function (oError) {
                    console.error("Error cargando detalle:", oError);
                    oDetalle.setProperty("/busy", false);
                });
        },

        onNavBack: function () {
            var oHistory = History.getInstance();
            var sPrevHash = oHistory.getPreviousHash();

            if (sPrevHash !== undefined) {
                window.history.go(-1);
            } else {
                this.getOwnerComponent().getRouter().navTo("RouteMain", {}, true);
            }
        }
    });
});
