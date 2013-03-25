YUI.add("yuidoc-meta", function(Y) {
   Y.YUIDoc = { meta: {
    "classes": [
        "Gen[A]",
        "RandGen",
        "Result",
        "Stream[A]",
        "TestRunner"
    ],
    "modules": [
        "jsqc",
        "test"
    ],
    "allModules": [
        {
            "displayName": "jsqc",
            "name": "jsqc",
            "description": "Javascript QuickCheck v. 0.0.1 (alpha)\nCopyright (c) 2013, Derek Elkins.  See LICENSE.\n\nTODO: Implement something like ScalaCheck's Command framework.\nTODO: Implement shrinking.\nTODO: Implement function generators.\nTODO: Implement exhaustive checking for small domains.\nTODO: Make elements, nonEmptyArrayOf, etc. select uniformly. Doing rand()%n is not uniform unless n is a power of two."
        },
        {
            "displayName": "test",
            "name": "test",
            "description": "Unit tests.\n\nCopyright (c) 2013, Derek Elkins.  See LICENSE."
        }
    ]
} };
});