<p align="center">
  <img width="180" src="https://github.com/user-attachments/assets/6d7161dd-8e40-4f5f-9163-9ba34492655b">
  <h1 align="center">Librezam</h1>
  <div align="center">Song recognition webextension using Shazam API</div>
</p>

[![Firefox](https://extensionworkshop.com/assets/img/documentation/publish/get-the-addon-178x60px.dad84b42.png)](https://addons.mozilla.org/firefox/addon/librezam/)

## What is it?
This is a browser extension that uses Shazam's internal API to recognize the music playing in the current tab.

Requests unrelated to music recognition, such as telemetry, will not be made.

This is unofficial project and is not affiliated or supported by *Shazam ltd.*

## Screenshot
![304658](https://github.com/user-attachments/assets/bf07a292-4f6e-4d16-91ad-dd07801825bd)


## Third-party libraries/Referenced codes
* [Iconsax Bold Oval Icons](https://www.svgrepo.com/svg/495541/music-square-search)([MIT](https://www.svgrepo.com/page/licensing/#MIT)) //Extension Icon
* [node-shazam-api](https://github.com/asivery/node-shazam-api)([GPL-2.0](https://github.com/asivery/node-shazam-api/blob/master/LICENSE)) //Create Audio Signature & Querying Shazam API

  \*Included as [my fork](https://github.com/FoxRefire/node-shazam-api/tree/webpack) with webpack support and some improvements.
* [Song-identifier](https://gitlab.com/losnappas/Song-identifier/-/blob/master/songid-react/src/record.js?ref_type=heads)([Unlicense](https://gitlab.com/losnappas/Song-identifier/-/blob/master/LICENSE?ref_type=heads)) //Algorithm of record audio from DOM Element
* [Materialize](https://github.com/materializecss/materialize)([MIT](https://github.com/materializecss/materialize/blob/main/LICENSE)) //App interface
* [Material Symbols & Icons](https://fonts.google.com/icons)([SIL Open Font License](https://openfontlicense.org/)) // App interface
