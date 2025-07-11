# Website-Customizer-Chrome
A Google Chrome plugin that allows you to save customized website appearance setting including background color and default zoom size

## Installation and Set Up
* Clone the repository or download and extract a zip file of the source code
* Open chrome, navigate to chrome://extensions/
* On the top-right corner you should see a "Developer mode" switch, turn on to enter developer mode
* Select the "Load unpacked" button
* Select the entire (unzipped) folder containing all source codes to load the plugin
* The plugin should be ready to use in the plugin library
Planning on recording a demo video later on :)

## Notes
At the moment the logic is that it scans through objects covering viewheight over 85% and considers it as a "background division" and override the background color of that object. But unfortunately it doesn't work perfectly well  for sites with complex structure. For example for Reddit.com it changes the background of the entire webpage, but since comment sections belong to a smaller division, their background remain as default. 

Using "Save Setting" itself won't immediately apply the change, can use refresh or "Apply on current site" to solve it.

I just started to work on this plugin and will keep improving it in the future! Open to ideas!!!!




