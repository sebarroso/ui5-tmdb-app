sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/routing/History"
], function (Controller, JSONModel, History) {
    "use strict";

    var POSTER_BASE = "https://image.tmdb.org/t/p/w92"; // tamaño pequeño para lista

    var API_KEY  = window.APP_CONFIG.TMDB_API_KEY;
    var API_BASE = window.APP_CONFIG.TMDB_API_BASE;

    return Controller.extend("demo.tmdb.controller.Top50", {

        onInit: function () {
            var oModel = new JSONModel();
            oModel.loadData("./model/movies_top50.json");

            // Cuando el JSON cargue, enriquecer con posters de TMDB
            oModel.attachRequestCompleted(function () {
                this._cargarPosters(oModel);
            }.bind(this));

            this.getView().setModel(oModel, "top50");
        },

        // Llama a /find para cada película y agrega el poster y tmdbId
        _cargarPosters: function (oModel) {
            var aMovies = oModel.getProperty("/movies");

            aMovies.forEach(function (oMovie, iIndex) {
                var sUrl = API_BASE
                    + "/find/" + oMovie.imdbId
                    + "?api_key=" + API_KEY
                    + "&external_source=imdb_id";

                fetch(sUrl)
                    .then(function (r) { return r.json(); })
                    .then(function (oData) {
                        var aResults = oData.movie_results || [];
                        if (aResults.length > 0) {
                            var oPoster = aResults[0].poster_path
                                ? POSTER_BASE + aResults[0].poster_path
                                : "";
                            // Guardar poster y tmdbId en el modelo
                            oModel.setProperty("/movies/" + iIndex + "/posterUrl", oPoster);
                            oModel.setProperty("/movies/" + iIndex + "/tmdbId", aResults[0].id);
                        }
                    })
                    .catch(function (e) {
                        console.error("Error cargando poster para " + oMovie.title, e);
                    });
            });
        },

        onMoviePress: function (oEvent) {
            var oContext = oEvent.getSource().getBindingContext("top50");
            var nTmdbId  = oContext.getProperty("tmdbId");

            if (nTmdbId) {
                // Navegar a la vista de detalle existente
                this.getOwnerComponent().getRouter().navTo("RouteDetalle", {
                    movieId: nTmdbId
                });
            }
        },

        onNavBack: function () {
            var oHistory  = History.getInstance();
            var sPrevHash = oHistory.getPreviousHash();
            if (sPrevHash !== undefined) {
                window.history.go(-1);
            } else {
                this.getOwnerComponent().getRouter().navTo("RouteMain", {}, true);
            }
        }
    });
});