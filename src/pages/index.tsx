import React from "react";
import {Home} from "../components/Home";
import Header from "../components/Header";
import {initReactI18next} from "react-i18next";
import en from "../locales/en/translation.json";
import es from "../locales/es/translation.json";
import i18n from 'i18next'
import {Helmet} from "react-helmet";
import '../css/index.css';

i18n
    .use(initReactI18next)
    .init({
        resources: {
            en: {
                translation: en
            },
            es: {
                translation: es
            }
        },
        fallbackLng: "en",
        interpolation: {
            escapeValue: false
        }
    });

export default function HomePage() {

    React.useEffect(() => {
        i18n.changeLanguage(navigator.language);
    }, []);

    return (
        <>
            <Helmet>
                <link rel="preconnect" href="https://fonts.googleapis.com"/>
                <link rel="preconnect" href="https://fonts.gstatic.com"/>
                <link
                    href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap"
                    rel="stylesheet"/>

                <link rel="stylesheet" href="https://unpkg.com/leaflet@1.6.0/dist/leaflet.css"
                      integrity="sha512-xwE/Az9zrjBIphAcBb3F6JVqxf46+CDLwfLMHloNu6KEQCAWi6HcDUbeOfBIptF7tcCzusKFjFw2yuvEpDL9wQ=="
                      crossOrigin=""/>
            </Helmet>
            <Header/>
            <Home/>
        </>
    );
}
