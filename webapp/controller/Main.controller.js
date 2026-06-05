sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (Controller, JSONModel, MessageToast, MessageBox) {
    "use strict";


    var API_KEY = window.APP_CONFIG.TMDB_API_KEY;
    var API_BASE = window.APP_CONFIG.TMDB_API_BASE;
    var POSTER_BASE = "https://image.tmdb.org/t/p/w92";

    return Controller.extend("demo.tmdb.controller.Main", {

        onInit: function () {
            this.getView().setModel(new JSONModel({
                busy: false,
                statusMessage: "",
                showPaging: false,
                currentPage: 1,
                totalPages: 1
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
            var oState = this.getView().getModel("appState");
            var nCurrent = oState.getProperty("/currentPage");
            var nTotal = oState.getProperty("/totalPages");
            if (nCurrent < nTotal) {
                oState.setProperty("/currentPage", nCurrent + 1);
                this._doSearch(this.byId("searchField").getValue().trim(), nCurrent + 1);
            }
        },

        onPrevPage: function () {
            var oState = this.getView().getModel("appState");
            var nCurrent = oState.getProperty("/currentPage");
            if (nCurrent > 1) {
                oState.setProperty("/currentPage", nCurrent - 1);
                this._doSearch(this.byId("searchField").getValue().trim(), nCurrent - 1);
            }
        },

        onMovieSelect: function (oEvent) {
            var oItem = oEvent.getParameter("listItem");
            var oContext = oItem.getBindingContext("movies");
            var nId = oContext.getProperty("id");

            this.getOwnerComponent().getRouter().navTo("RouteDetalle", {
                movieId: nId
            });
        },
        onNavTop50: function () {
            this.getOwnerComponent().getRouter().navTo("RouteTop50");
        },
        _doSearch: function (sQuery, nPage) {


            var oAppState = this.getView().getModel("appState");
            var oMovies = this.getView().getModel("movies");

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

                    // Armar URL del poster para cada resultado
                    if (oData.results) {
                        oData.results.forEach(function (oMovie) {
                            oMovie.posterUrl = oMovie.poster_path
                                ? POSTER_BASE + oMovie.poster_path
                                : "";
                        });
                    }

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
        },
        onDisclaimer: function () {
            MessageBox.information(
                "Este sitio es una aplicación de uso personal y educativo, desarrollada sin fines comerciales.\n\n" +
                "Todas las películas, títulos, imágenes, posters y demás contenidos audiovisuales mencionados o " +
                "mostrados en esta aplicación son propiedad de sus respectivos autores, productoras, distribuidoras " +
                "y/o titulares de derechos. Su inclusión tiene únicamente carácter informativo y referencial.\n\n" +
                "Los datos e imágenes son provistos por The Movie Database (TMDB) y/o IMDb. Esta aplicación no está " +
                "afiliada ni patrocinada por ninguna de estas plataformas.\n\n" +
                "El desarrollador de esta aplicación no se responsabiliza por el uso que terceros puedan hacer del " +
                "contenido aquí referenciado, ni garantiza la exactitud o actualización de la información mostrada.\n\n" +
                "© Todos los derechos de las obras pertenecen a sus respectivos propietarios.",
                {
                    title: "Disclaimer",
                    icon: MessageBox.Icon.INFORMATION,
                    actions: [MessageBox.Action.CLOSE]
                }
            );
        }
    });
});
