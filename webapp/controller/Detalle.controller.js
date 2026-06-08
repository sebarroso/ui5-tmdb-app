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

        onShare: function () {
            var oDetalle = this.getView().getModel("detalle");
            var sTitle   = oDetalle.getProperty("/title") || "Película";
            var sOverview = oDetalle.getProperty("/overview") || "";
            var sPosterUrl = oDetalle.getProperty("/posterUrl") || "";
            var sRating  = oDetalle.getProperty("/vote_average") || "";
            var sYear    = (oDetalle.getProperty("/release_date") || "").substring(0, 4);
            var sMovieId = oDetalle.getProperty("/id") || "";

            // URL de la película en esta app (hash routing)
            var sAppUrl = window.location.origin + window.location.pathname + "#/detalle/" + sMovieId;

            // Texto formateado para compartir
            var sText = "🎬 " + sTitle + (sYear ? " (" + sYear + ")" : "") +
                        "\n⭐ " + sRating +
                        (sOverview ? "\n\n" + sOverview.substring(0, 120) + "..." : "") +
                        "\n\n🔗 " + sAppUrl;

            // --- Generar preview con Canvas ---
            var oCanvas  = document.createElement("canvas");
            oCanvas.width  = 600;
            oCanvas.height = 300;
            var oCtx = oCanvas.getContext("2d");

            // Fondo degradado
            var oGrad = oCtx.createLinearGradient(0, 0, 600, 0);
            oGrad.addColorStop(0, "#1a1a2e");
            oGrad.addColorStop(1, "#16213e");
            oCtx.fillStyle = oGrad;
            oCtx.fillRect(0, 0, 600, 300);

            // Función para dibujar texto y luego abrir diálogo de compartir
            var fnDrawTextAndShare = function () {
                // Título
                oCtx.fillStyle = "#ffffff";
                oCtx.font = "bold 22px Arial";
                oCtx.fillText(sTitle.substring(0, 38), 220, 60);

                // Año
                if (sYear) {
                    oCtx.fillStyle = "#aaaaaa";
                    oCtx.font = "16px Arial";
                    oCtx.fillText(sYear, 220, 88);
                }

                // Rating
                oCtx.fillStyle = "#f5c518";
                oCtx.font = "bold 18px Arial";
                oCtx.fillText("⭐ " + sRating, 220, 120);

                // Sinopsis (máx 3 líneas)
                oCtx.fillStyle = "#cccccc";
                oCtx.font = "14px Arial";
                var sDesc = sOverview.substring(0, 180);
                var aWords = sDesc.split(" ");
                var sLine = "";
                var nLineY = 160;
                for (var i = 0; i < aWords.length; i++) {
                    var sTest = sLine + aWords[i] + " ";
                    if (oCtx.measureText(sTest).width > 360 || nLineY > 220) {
                        if (nLineY <= 220) {
                            oCtx.fillText(sLine, 220, nLineY);
                            nLineY += 22;
                        }
                        sLine = aWords[i] + " ";
                    } else {
                        sLine = sTest;
                    }
                }
                if (sLine && nLineY <= 220) {
                    oCtx.fillText(sLine.trim() + "...", 220, nLineY);
                }

                // URL app en el pie
                oCtx.fillStyle = "#888888";
                oCtx.font = "12px Arial";
                oCtx.fillText(sAppUrl, 220, 270);

                // Borde dorado
                oCtx.strokeStyle = "#f5c518";
                oCtx.lineWidth = 3;
                oCtx.strokeRect(2, 2, 596, 296);

                // --- Mostrar previsualización en un Dialog y ofrecer compartir ---
                var sDataUrl = oCanvas.toDataURL("image/png");

                var oPreviewHtml = new sap.m.Dialog({
                    title: "Compartir película",
                    contentWidth: "640px",
                    content: [
                        new sap.ui.core.HTML({
                            content: "<div style='text-align:center;padding:1rem;'>" +
                                     "<img src='" + sDataUrl + "' style='max-width:100%;border-radius:8px;'/>" +
                                     "<p style='margin-top:1rem;word-break:break-all;font-size:12px;color:#666;'>" + sAppUrl + "</p>" +
                                     "</div>"
                        })
                    ],
                    buttons: [
                        new sap.m.Button({
                            text: "📋 Copiar enlace",
                            press: function () {
                                navigator.clipboard.writeText(sText).then(function () {
                                    sap.m.MessageToast.show("¡Enlace copiado!");
                                }).catch(function () {
                                    sap.m.MessageToast.show("No se pudo copiar. URL: " + sAppUrl);
                                });
                            }
                        }),
                        new sap.m.Button({
                            text: "📤 Compartir",
                            type: "Emphasized",
                            press: function () {
                                if (navigator.share) {
                                    navigator.share({
                                        title: sTitle,
                                        text:  sText,
                                        url:   sAppUrl
                                    }).catch(function () { /* usuario canceló */ });
                                } else {
                                    navigator.clipboard.writeText(sText).then(function () {
                                        sap.m.MessageToast.show("Texto copiado al portapapeles");
                                    });
                                }
                            }
                        }),
                        new sap.m.Button({
                            text: "Cerrar",
                            press: function () { oPreviewHtml.close(); }
                        })
                    ],
                    afterClose: function () { oPreviewHtml.destroy(); }
                });

                oPreviewHtml.open();
            };

            // Cargar poster en canvas si existe
            if (sPosterUrl) {
                var oImg = new Image();
                oImg.crossOrigin = "anonymous";
                oImg.onload = function () {
                    oCtx.drawImage(oImg, 10, 10, 180, 270);
                    fnDrawTextAndShare();
                };
                oImg.onerror = function () {
                    fnDrawTextAndShare();
                };
                oImg.src = sPosterUrl;
            } else {
                fnDrawTextAndShare();
            }
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
