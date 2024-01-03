var currentScene; // This variable is used to access the Phaser scene outside the create() function

/* Behind-the-scenes camera-related variables */
var camera; // This variable is used to access the camera
var cameraTarget; // This is the object the camera will follow. (I find it awkward to try to move the camera directly in the Phaser framework, but the framework provides a handy workaround.)
var distanceToCameraTarget = 0; // This variable is used to determine whether the camera has caught up
var zoom = 1; // How far in should the camera be zoomed?
var centeringAndZooming = false; // Used to signal that the animation has finished, but the camera isn't yet fully centered and zoomed in
var requestForceZoom = false; // Used to tell drawFigure() whether to jump right to max fit zoom; if false, camera movement will be smoother
var requestForceCenter = false; // Used to tell drawFigure() whether to jump right to actual fractal center; if false, camera movement will be smoother
var requestedCenter; // The actual center of the fractal
var minX, minY, maxX, maxY; // The boundaries of the fractal (used to calculate the center)

/* User input-related camera variables */
var userMovingCamera = false; // Used to signal when the user is moving the camera (up, down, left, or right) manually
var userRotatingCamera = false; // Used to signal when the user is rotating the camera manually
var userZoomingCamera = false; // Used to signal when the user is zooming the camera in or out manually
var userChangingLineThickness = false; // Used to signal when the user is requesting that the fractal's line be made thicker or thinner
var userChangingAnimationSpeed = false; // Used to signal when the user is requesting that the animation speed up or slow down
var userInputDirection; // Used to signal which direction the user was asking camera to move, zoom, or rotate (or in which direction they were asking the line thickness or animation speed to be changed)
var okayToShowControlButtons = false; // Don't show the control buttons (which appear when you mouse over the canvas) to the user until the could actually be used to control the animation

/* Variables to determine if and when the next frame of animation should be drawn */
var animationStyle = 1; // Should the app show the iteration sequence (0) or animate the final iteration (1) in Lindenmayer mode? Or should it animate the number line up to a particular angle (2) or indefinitely (3) in Prime Number mode?
var animatingLine = false; // Are we currently animating fractal? (e.g., rotating its various portions)
var timeOfLastUpdate = 0; // When was the last frame of animation drawn?
var timeBetweenDraws = 10; // How long should we wait to draw the next frame while animating? (Default: 10ms; this effectively means the next frame should be drawn as soon as possible.)
var timeSinceLastDraw = 0; // How long has it been between the previous animation frame and now?
var currentProportion = 0; // What proportion of the angle specified for a turn should currently be displayed?
var proportionIncrement = 10; // How much should currentProportion be increased/decreased between draws?
var incrementDirection = 0.01; // Should the increment be in the positive or negative direction?
var paused = false; // Was the pause button pressed while animating?

var box; // The box marking the end of fractal part the user is drawing
var lineForDrawing; // A line to show where the user is trying to place the next line segment when drawing
var lineForDrawingPoints = []; // The points marking the beginning and ending of that line
var lineForFractalPart; // The line used to display the complete fractal segment the user is drawing
var lineForFractalPartPoints = []; // The points that mark the start, end, and turning points in that line
var newLineSegment = true; // Keep track of whether the user has started drawing a new line segment
var stepDistanceDrawing = 100; // How long the line segments should be while drawing.
var drawingLineThickness = 10; // The width of the line used when the user is drawing on the canvas

var lineForFractal; // The line for drawing the actual fractal
var lineForFractalPoints = []; // The points marking the beginning, end, and turning points in that line
var stepDistance = 25; // How long a line segment in fractal is
var fractalLineThickness = 3; // How thick the fractal line should be
var marker; // The object whose position and rotation lineForFractal will follow
var angleSum; // The total amount the fractal line turns as it goes along

var colorMode = 0; // Whether to draw the line in multiple colors on black background (0), in white on black background (1), or black on white background (2)
var colorWhite = Phaser.Display.Color.GetColor(255, 255, 255);
var colorBlack = Phaser.Display.Color.GetColor(0, 0, 0);
var currentColor = colorWhite; // Since the color mode can change, we need to keep track of what color we should use to draw the fractal

/* Lindenmayer Mode variables*/

var instructionString = ""; // The string of characters to use as instructions for drawing the line
var replacementRulesArray = []; // The rules that say what characters in instructionString will be replaced with which other characters
var interpretationRulesArray = []; // The rules that say what the marker will do in response to the characters in instructionString
var replacementRulesJSON = {}; // The JSON forms of the replacement rules, for quick access
var interpretationRulesJSON = {}; // The JSON forms of the interpretation rules, for quick access
var numIterations = 0; // How many times to expand the string using the replacement rules
var currentIteration = 0; // Which of the iterations we are currently on

var presets = {}; // The list of built-in fractals, fetched from CSV
var menuNeedsListener = true; // Used to avoid giving the presets selection menu multiple listeners
var currentFractalCategory; // What category of fractal has the user selected from the menu?

/* Prime Number Mode variables */

var primeInstructions = []; // We need a different way of storing our string of instructions in this mode
var primeAngles = []; // If animationStyle == 2, what angle the user has chosen for each of the prime numbers they have chosen
var primeMultipliers = []; // If animationStyle == 3, how fast should the the fractal turn, from one frame to the next, for each prime number the user has chosen?
var numberLineSuggestedLength = 1000; // How long should the number line be? (Higher numbers lead to slower animation, but more detail)

/* HTML-related elements */

var idCounter = 0; // When generating new HTML elements, we need to give them unique IDs
var shiftKey; // Reference to the keyboard shift key
var forceCenterZoomBool = false; // Used to keep track of whether the user has checked the forceCenterZoomBox
var forceCenterZoomBox; // The HTML checkbox for users to request that the camera center and zoom to make the fractal fully fit the screen on every frame
var instructionStringTextbox; // The HTML textbox into which the user must type at least one letter to get the Lindenmayer Mode going.
var buttonGo; // The button the user must press to start the animation in Lindenmayer mode
var htmlReplacementRulesDIV; // The HTML div that contains the textboxes for the replacement rules
var htmlInterpretationRulesDIV; // The HTML div that contains the menus and textboxes for the interpretation rules
var currentAngleDIVs = []; // If animationStyle == 1 or 2, show how close to the goal angle we currently are
var radioButtonsDIV; // The HTML div that contains the radio buttons for selecting radians or degrees mode
var radians = false; // Should the user enter angles in terms of radians? (if false, the user should use degrees)
var animateDIV; // The HTML div containing the elements that allow the user to start/adjust the animation ahead of time
var outputDIV; // The HTML div for showing the user basic info about their fractal

/* When a new replacement rule or interpretation rule needs to be created, the following is the HTML code we will need */
var replacementRuleHTML = `<div class="replacementRule"><span class="symbol"></span><span class="arrow"> becomes </span><input type="text" class="ruleTextbox"></div>`;
var interpretationRuleHTML = `<div class="interpretationRule"><span class="symbol"></span><span class="means">&nbsp;&nbsp;means&nbsp;&nbsp;</span><select class="interpretationSelect"><option value="nothing">Do Nothing</option><option value="forward">Step Forward</option><option value="back">Step Back</option><option value="right">Turn Right</option><option value="left">Turn Left</option></select><span class="angle"><input type="text" class="angleTextbox"><span class="pi"> degrees</span><span class="currentAngle"></span></span></div>`;

var percentDIV; // Used to show how close we are to completing the animation

var instructionStringContainer; // The panel to show how the instruction string has evolved.
var instructionStringContainerText; // The text area within that panel
var scaleDIV; // Used to show how the instruction string has scaled up from iteration to iteration
var stringLengthDIV; // Used to show how long the string grew to with the latest iteration

var toolTipsOn = true; // Does the user want to see tooltips?
var modeSelect; // The dropdown menu for choosing between Lindenmayer and Prime Numbers modes
var lindenmayerAnimationSelect; // The dropdown menu for choosing between animationStyles 0 and 1
var primeAnimationSelect; // The dropdown menu for choosing between animationStyles 2 and 3
var instructionStringButton; // The button to show the instruction string panel

var iterationsBox; // The textbox into which the user types the number of iterations they want

var primeCheckboxes = []; // In Prime Numbers mode, allow the user to select the prime numbers they want to employ
var angleEndBoxes = []; // In Prime Numbers mode, allow user to specify the angles they want the line to turn to
var angleStartBoxes = []; // In Prime Numbers mode, allow the user to specy the angles with which they want to start

/* Regex for checking user input for textboxes */
var regexForReplacementStrings = /[^A-Za-z]/; // Only allow letters in replacement strings, so this will find any non-letters
var regexForAngles = /^([\d./\b])/; // Only allow numerical digits, periods, and forward slashes for specifying angles

/** boilerplate setup variables for Phaser */
const config = 
{
    type: Phaser.AUTO,
    backgroundColor: '#000000',
    scale: {
        mode: Phaser.Scale.FIT, // This will make the display canvas resize to fit the user's screen
        parent: 'phaser',
        width: 800, // The goal width and height
        height: 600
    },

    scene: // The three main functions in a Phaser app
    {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config); // Create the Phaser app on this page; this adds a canvas selement to the Phaser div on the page

/** A Phaser function. Load images for use in create() */
function preload()
{
    this.load.image('marker','images/onePixel.png');
    this.load.image('box','images/square.png')
}

/** A Phaser function: Gets the app started */
function create()
{
    currentScene = this; // Get a reference to the current scene so it can be accessed elsewhere
    camera = this.cameras.main; // Get a reference to the camera so it can be accessed easily later

    setupDrawingElements(); // Get ready to draw the various lines to the canvas
    camera.startFollow(cameraTarget, false, 1, 1, 0, 0); // We will move the camera by moving its target (which was set up in setupDrawingElements())
    cameraTarget.visible = false; // We don't want to see the object the camera is following
    marker.visible = false; // We don't want to see the object whose position and rotation will be used to draw the line

    setupHTMLListeners(); // Attach all the HTML elements to their corresponding JavaScript functions

    setupCanvasListeners(); // Get the canvas ready for the user to draw on, if they wish

    processURLParams(); // Check the URL to see if it contains instructions for accessing a specific fractal

    getSeedRules(); // If processURLParams() found instructions in the URL, we need to copy them from HTML into JavaScript

    loadPresets(); // Go get all the built-in fractals from the CSV

    animatingLine = false; // We aren't drawing a fractal to the canvas at the moment
    currentProportion = 0; // We probably want to start animating, when we do, at 0%, then work our way up to 100%

    drawTextboxString(document.activeElement.value); // If an instruction string was loaded by processURLParams(), draw it to the canvas

    checkMode(); // Check whether we are in Lindenmayer or Prime Numbers mode (not really needed at the moment; processURLParams() assumes we are in Lindenmayer mode for the time being)
}

/** Phaser calls this funtion every "frame" (roughly 60 times per second, I believe.) Used to animate things, etc.
 *  @param time - The current time; automatically generated by Phaser
 *  @param delta - The ideal amount of time between updates; automatically generated by Phaser; not always accurate
*/
function update(time, delta)
{
    delta = time - timeOfLastUpdate; // Correct delta to show actual amount of time since last call to update()

    timeOfLastUpdate = time; // Store the current time for use in the next call to update()

    /* If the user has requested that we begin animating the line, then we need to do so. */
    if(animatingLine)
    {        
        /*  However, we don't want the animation to speed up and slow down depending on the user's hardware 
            or system load at the moment. We can't avoid slowdowns, but we can cap the frame rate to avoid
            unwanted speedups. So, if it hasn't been long enough since the previous draw, then wait to the 
            next call to update() */
        if(timeSinceLastDraw >= timeBetweenDraws) 
        {   
            /*  animationStyle 0 isn't really an animation. So, we'll deal with it separately */
            if(animationStyle > 0)
            {
                /*  If we are animating "forward," toward 100%, but haven't yet reached 100%, 
                    or if we are animating "backward," toward 0%, but haven't yet reached 0% . . . */
                if(animationStyle == 3 || (incrementDirection > 0 && (currentProportion < 1))
                    || (incrementDirection < 0 && (currentProportion > 0)))
                {
                    /* . . . then we can take the next step in the animation*/
                    
                    /* If we are just starting the animation . . . */
                    if(currentProportion == 0 || currentProportion == 1)
                    {
                        /* . . . then we want to begin with the fractal fully fitting the screen */
                        requestForceCenter = true;
                        requestForceZoom = true;
                    }

                    /* If the user has requested that the fractal full fit the screen on every frame . . .*/
                    if(forceCenterZoomBool)
                    {
                        /*  . . . then draw the next frame of the animation and force the camera to 
                            center the fractal on screen and zoom in fully*/
                        drawFigure(true, true); 
                    }
                    else
                    {
                        /*  . . . otherwise, draw the next frame of the animation, but go with whatever 
                            centering/zooming settings have been chosen elsewhere */
                        drawFigure(requestForceCenter, requestForceZoom);
                    }
                    
                    /*  The main work has been done now, with the call to drawFigure(). So, all we have left is 
                        cleanup. */

                    /*  If the user has requested that the animation speed up so much that they have effectively
                        requested more than 100% of the total animation to be completed on the next frame, 
                        slow things down a bit */
                    if(proportionIncrement > 1)
                    {
                        proportionIncrement = 0.0001;
                    }

                    /*  The animation happens, in the normal case, because the user has specified that particular 
                        symbols in the instruction string should represent turns of particular angles, but we start off 
                        only displaying 0% of the requested angles. We then gradually increase the percentage till 
                        we reach the requested angle. (See drawFigure() for details.)
                        
                        This is like someone saying, "Could you open all red doors to 90 degrees, but all blue doors
                        to 60 degrees?" But what we in fact do is open all the red doors to 1% of 90 degrees and
                        all the blue doors to 1% of 60 degrees. Then, on the next animation frame, we open all the red 
                        doors to 2% of 90 degrees, and all the blue doors to 2% of 60 degrees. Then, on the next frame,
                        we open all the red doors to 3% of 90 degrees, and all the blue doors to 3% of 60 degrees. Etc. 
                        On the 100th frame, we will finally open all the red doors to 100% of 90 degrees, and all the 
                        blue doors to 100% of 60 degrees.

                        To decide what percentage of the way to "open" the "doors" on the next frame, we add
                        proportionIncrement (the number specifying what percentage change to make from frame to frame)
                        to the currentProportion. Well, we add it if we are animating forward, but we subtract it
                        if we are "rewinding" the animation, playing it backward. (incrementDirection is always 1 or -1.)
                        */
                    currentProportion += incrementDirection * proportionIncrement;

                    timeSinceLastDraw = 0; // We just drew a new frame of animation, so . . .

                    /*  When the total angle turned by the line over the course of its length is 0, the animation
                        tends to look best when the figure fits the screen exactly on every frame. Otherwise,
                        unless the user has requested otherwise, allow the camer to move more smoothly */
                    if(angleSum != 0)
                    {
                        requestForceCenter = false;
                        requestForceZoom = false;
                    }
                }
                else if(animationStyle != 3)
                {
                    /*  In animationStyle 3, there is no "end state" for the animation. In animationStyles 1 and 2,
                        however, if we are animating forward and have reached currentProportion >= 1, or if we are
                        animating backward and have reached currentProportion <= 0, we have reached the end of
                        the animation. */

                    /*  If we accidentally went past 0 when going backward, or past 1 when going forward, we need
                        to fix that */
                    if(currentProportion < 0)
                    {
                        currentProportion = 0;
                    }
                    else if(currentProportion > 1)
                    {
                        currentProportion = 1;
                    }

                    /* Draw the line one last time in its final state (in case we went past the end previously) */
                    drawFigure(requestForceCenter, requestForceZoom);
                    animatingLine = false; // We're done with the animation
                    centeringAndZooming = true; // However, now we need to make sure that the camera finishes catching up
                    timeSinceLastDraw = 0; // We just drew a new frame of animation, so . . .
                }
            }
            else
            {
                /*  In animationStyle 0, we aren't animating the line. Rather, we are presenting a slide show 
                    of what the line would look like after each iteration of the instruction string. */

                /*  If we are on the first iteration of the instruction string . . . */
                if(currentIteration == 0)
                {
                    timeBetweenDraws = 1000; // Give each iteration a full second on screen
                    currentProportion = 1; // Jump right to the full angle(s) requested by the user
                    camera.rotation = 0; // We don't want the camera to be rotated, at least not to start
                    /*  We need to call this again to avoid a bug where playing the full animation in 
                        animationStyle 1, then switching to animationStyle 0 and pressing the "GO" button
                        doesn't start the animation over from the beginning. */
                    prepForFractalAnimation(); // Get everything set up for drawing the line
                    drawFigure(true, true); // Draw the line, and fit the figure to the screen
                    scaleDIV.innerHTML += "0: N/A"; // The instruction string hasn't scaled up yet
                    /*  Keep track of how the instruction string grows from one iteration to the next. */
                    instructionStringContainerText.innerHTML = "<p>Started with: " + instructionString + "</p>"; 
                }
                else
                {
                    /*  If we have already drawn the line based on the initial state of the instruction string, 
                        then we need to iterate the instruction string */
                    sequenceFractal();
                    drawFigure(true, true); // Then we need to draw the new form of the line 
                }

                timeSinceLastDraw = 0; // Time to start waiting for the next animation frame
                currentIteration++; // Move on to the next iteration of the instruction string
            }
        }
        else
        {
            /*  If it isn't time to draw the next frame of animation, keep track of how long we've been waiting. */
            timeSinceLastDraw += delta;
        }

        if(animationStyle == 0)
        {
            /*  If we are presenting a slide show of each iteration, let the user know what iteration we're on */
            percentDIV.parentElement.children[0].innerHTML = "Iteration: ";

            if(currentIteration < numIterations)
            {  
                percentDIV.innerHTML = currentIteration + " / " + numIterations;
            }
            else
            {
                percentDIV.innerHTML = numIterations + " / " + numIterations;
            } 
        }
        else if(animationStyle < 3)
        {
            /*  If we are animating the line up to a particular point, let the user know what percentage of the 
                animation we have completed so far */
            percentDIV.parentElement.children[0].innerHTML = "Animation: ";
            percentDIV.innerHTML = (currentProportion * 100).toLocaleString(undefined, {minimumIntegerDigits: 3}) + "%";
        }
    }   
    else if(centeringAndZooming)
    {
        /*  If we have finished animating, but the camera hasn't caught up to perfectly frame the fractal, then
            move the camera toward the center of the fractal and adjust the zoom a bit */
        centerAndZoom(false, false);
    }

    /*  While the app can move and "zoom" the camera automatically, the user can also make adjustments manually */
    if(userMovingCamera)
    {
        moveCamera();
    }
    else if(userRotatingCamera)
    {
        rotateCamera();
    }
    else if(userZoomingCamera)
    {
        zoomCamera();
    }
    else if(userChangingLineThickness)
    {
        changeLineThickness();
    }
    else if(userChangingAnimationSpeed)
    {
        changeAnimationSpeed();
    }
}

/**
 * Forms the core of the app, along with update(). Draws the line following the instructions provided by the user.
 * @param {boolean} forceCenter - Should the camera keep the figure exactly centered on each frame? Default: false
 * @param {boolean} forceZoom - Should the camer keep the figure fully zoomed on each frame? Default: false
 */
function drawFigure(forceCenter, forceZoom)
{
    if(forceCenter == null)
    {
        forceCenter = false;
    }

    if(forceZoom == null)
    {
        forceZoom = false;
    }

    /*  We will change this object's angle and move it around, following the instructions in the
        instruction string. We will then draw the line through the various points it has occupied.
        There's no particular reason (400, 400) should be the starting point. */
    marker.setPosition(400,400);
    marker.angle = 0;

    /*  We need these four values to find the center of the figure to center the camera on. The starting point is
        the default min and max, which will get overridden as the marker gets moved around. */
    minX = marker.x;
    maxX = marker.x;
    minY = marker.y;
    maxY = marker.y;

    /*  Phaser draws lines by connecting the points in an array. We need to clear out the array that we will
        use for drawing the main line, so that we can add new points to it.*/
    lineForFractalPoints = [];

    /*  Add the marker's starting position to the array, so that the first "step forward" or "step backward"
        instruction will add a second point and thus a complete line segment. */
    lineForFractalPoints.push(new Phaser.Geom.Point(marker.x, marker.y));

    /*  If we are in Lindenmayer mode . . . */
    if(animationStyle < 2)
    {
        /*  The instruction string can be hundreds of thousands of characters long. We want to avoid
            having to get its length every time through the for() loop below, in the off chance
            that all those "gets" would take extra time. So, store it in its own variable. */
        var instructionStringLength = instructionString.length;

        /*  To avoid having the look up the current rule each time we use it, below, store it in
            its own variable. */
        var currentRule;

        /*  We need to read through the instructionString, character by character,moving and rotating the 
            marker following the rules corresponding to each character. This is an implementation of what 
            is generally known as "turtle graphics": https://en.wikipedia.org/wiki/Turtle_graphics */
        for(var i = 0; i < instructionStringLength; i++)
        {
            /*  To figure out what to do next, we need to read the next character in the instructionString. */
            currentLetter = instructionString.charAt(i);

            /*  Look up the interpretation rule that corresponds to the current letter. */
            currentRule = interpretationRulesJSON[currentLetter];

            /*  If we found an interpretation rule for the current letter, we can continue. Otherwise,
                we need to skip the current letter. */
            if(currentRule != null)
            {
                /*  Interpretation rules are stored as dictionary entries, with a letter as key, and an array
                    as value. The array has two elements: a word specifying the action to be taken, and a number
                    specifying the angle to be turned. If the action to be taken wasn't a turn, we can ignore the
                    angle. */
                switch(currentRule[0])
                {
                    case 'forward':
                        /*  Move the marker one step forward, in the direction it is currently facing (as specified
                            by its rotation. */
                        marker.setPosition(marker.x + Math.cos(marker.rotation) * stepDistance, marker.y + Math.sin(marker.rotation) * stepDistance);      
                        
                        /*  Add the marker's new position to the array of points that the line will need to be 
                            drawn through */
                        lineForFractalPoints.push(new Phaser.Geom.Point(marker.x, marker.y));
                        break;
                    case 'back':
                        /*  Same thing, except in this case we take a step backward */
                        marker.setPosition(marker.x - Math.cos(marker.rotation) * stepDistance, marker.y - Math.sin(marker.rotation) * stepDistance);
                        lineForFractalPoints.push(new Phaser.Geom.Point(marker.x, marker.y));
                        break; 
                    case 'right':
                        /*  Turn clockwise the number of degrees specified by the current interpretation rule,
                            However, we only turn a specific proportion of the specified angle. The variable,
                            currentProportion, should always be between 0.0 and 1.0, and thus we can "turn 50%"
                            of the way to the specified angle by setting currentProportion to 0.5, or we can
                            turn 25% of the way by setting current proportion to 0.25. (E.g., if the angle specified
                            by the current rule is 90 degrees, and the currentProportion is 0.5, we will actually
                            turn 45 degrees on the current frame. However, if currentProportion is 0.0, we won't
                            turn at all, and the resulting line will be straight). The actual value of 
                            currentProportion is generally set by update() and is adjusted from frame to frame to 
                            cause the line to slowly bend/fold into its final form. 
                            [Note:  angles are stored internally as degrees, even if the user specifies them in
                                    terms of radians'*/
                        marker.angle += currentRule[1] * currentProportion;
                        break;
                    case 'left':
                        /*  Ditto, but for turns in the counter-clockwise direction. */
                        marker.angle -= currentRule[1] * currentProportion;
                        break;
                }

                /*  Check to see if we have new mins and maxes for the figure, to help the camera stay centered. */
                if(marker.x < minX)
                {
                    minX = marker.x;
                }
                else if(marker.x > maxX)
                {
                    maxX = marker.x;
                }

                if(marker.y < minY)
                {
                    minY = marker.y;
                }
                else if(marker.y > maxY)
                {
                    maxY = marker.y;
                }
            }
        }
    }
    else
    {
        /*  If we are in Prime Numbers mode, are working with the number line, up to a particular integer, rather
            than working with a string of characters of a particular length. The instructions we will follow
            are also stored as arrays of integers, rather than as a string of letters. The arrays will always have
            a length greater than or equal to the length of the number line we are working with, so we will
            always have enough instructions to "cover" the full length of the line. In this for() loop
            we step along the number line, one integer at a time, from 1 to numberLineSuggestedLength. */
        for(var i = 0; i < numberLineSuggestedLength; i++)
        {
            /*  In Prime Numbers mode, each integer in an instruction array means to step forward and turn. 
                So, furst, take a step forward (moving to the next integer on the number line), in the 
                direction we are currently facing. */
            marker.setPosition(marker.x + Math.cos(marker.rotation) * stepDistance, marker.y + Math.sin(marker.rotation) * stepDistance);      
            
            /*  Add the new point to the array that the app will use to drawn the line */
            lineForFractalPoints.push(new Phaser.Geom.Point(marker.x, marker.y));
    
            /*  For each prime number the user selected, there will be an array of integers representing
                the highest powers of that prime number that evenly divides the natural numbers between 1
                and numberLineSuggestedLength. Those arrays are stored together in the primeInstructions
                array.  
                
                For example, if the user has selected the prime numbers 2, 3, and 5, primeInstructions
                will contain three arrays. 
                For 2, the array will be, [0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 4, . . .]. 
                For 3, the array will be, [0, 0, 1, 0, 0, 1, 0, 0, 2, 0, 0, 1, 0, 0, 1, 0, . . .]. 
                For 5, the array will be, [0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, . . .].
                In other words, the highest powers of 2, 3, and 5 that evenly divide 1 are 2^0, 
                3^0, and 5^0. The highest powers of 2, 3, and 5 that divide 2 are 2^1, 3^0, and 5^0.
                The highest powers of 2, 3, and 5 that evenly divide 3 are 2^0, 3^1, and 5^0. For 
                6, however, it would be 2^1, 3^1, and 5^0. For 12, it would be 2^2, 3^1, and 5^0.
                For 15, it would be 2^0, 3^1, and 5^1. Etc.
                
                The user will have specified an angle for each prime number (in animationStyle 2) or
                a relative speed for each prime number (in animationStyle 3). 
                
                In animationStyle 2, for example, imagine that the user specified 90 degrees for 2, 
                60 degrees for 3, and 45 degrees for 5. 
                So, at 1 on the number line, the three arrays contained in primeInstructions would tell
                us to turn: 0 x 90 degrees + 0 x 60 degrees + 0 x 45 degrees (for a total of 0 degrees).
                At 2 on the number line, primeInstructions will tell us to turn: 1 x 90 degrees + 0 x 60 
                degrees + 0 x 45 degrees (for a total of 90 degrees).
                At 3 on the number line, primeInstructions will tell us to turn: 0 x 90 degrees + 1 x 60
                degrees + 0 x 45 degrees (for a total of 60 degrees). 
                At 4 on the number line, primeInstructions will tell us to turn: 2 x 90 degrees + 0 x 60 
                degrees + 0 x 45 degrees (for a total of 180 degrees).
                At 5 on the number line, primeInstructions will tell us to turn: 0 x 90 degrees + 0 x 60 
                degrees + 1 x 45 degrees (for a total of 45 degrees).
                Etc.
                
                On any given frame, however, we may not turn the total amount requested, just as in 
                animationStyle 1. Instead, we will turn the currentProportion of the total amount requested. 
                currentProportion is generally set and adjusted by update(), and gradually chaning it makes
                the line appear to bend/fold into its final form.
                
                The same process works for animatinStyle 3, but we multiply by relative amounts rather than
                specific angles.*/
            for(var j = 0; j < primeInstructions.length; j++)
            {
                if(animationStyle == 2)
                {
                    marker.angle += currentProportion * primeInstructions[j][i] * primeAngles[j];
                }
                else
                {
                    marker.angle += currentProportion * primeInstructions[j][i] * primeMultipliers[j]
                }
            }
    
            /*  Check to see if we have new mins and maxes for the figure, to help the camera stay centered. */
            if(marker.x < minX)
            {
                minX = marker.x;
            }
            else if(marker.x > maxX)
            {
                maxX = marker.x;
            }
    
            if(marker.y < minY)
            {
                minY = marker.y;
            }
            else if(marker.y > maxY)
            {
                maxY = marker.y;
            }
        }
    }

    centerAndZoom(forceCenter, forceZoom); // Take care of the camera's movement and zoom levels

    setLineForFractal(fractalLineThickness / zoom); // Adjust the thickness of the line based on zoom levels

    /*  Now actually draw the line, based on points stored by moving the marker around, above */
    if(lineForFractalPoints.length > 0)
    {
        strokePoints();
    }

    /* Update the user on where were are at in the animation */
    if(animationStyle != 3)
    {
        for(var i = 0; i < currentAngleDIVs.length; i++)
        {
            var angleTextboxValue;
            
            if(animationStyle < 2)
            {
                angleTextboxValue = currentAngleDIVs[i].parentElement.children[0].value;
            }
            else if(currentAngleDIVs[i].parentElement.children[5] != null)
            {
                angleTextboxValue = currentAngleDIVs[i].parentElement.children[5].value;
            }

            if(angleTextboxValue != null && angleTextboxValue != "" && angleTextboxValue != 0)
            {
                currentAngleDIVs[i].innerHTML = " [" + (angleTextboxValue * currentProportion).toLocaleString(undefined, {minimumIntegerDigits: 3}) + "]";
            }
        }
    }
} 

/**
*   Called by update() and drawFigure() to handle camera movement.
*/
function centerAndZoom(forceCenter, forceZoom)
{
    requestedCenter = new Phaser.Math.Vector2((maxX + minX) / 2, (maxY + minY) / 2);

    if(forceCenter)
    {
        camera.centerOn(requestedCenter.x, requestedCenter.y);
        cameraTarget.x = requestedCenter.x;
        cameraTarget.y = requestedCenter.y;
    }
    else
    {
        cameraTarget.x = Phaser.Math.Linear(cameraTarget.x, requestedCenter.x, 0.1);   
        cameraTarget.y = Phaser.Math.Linear(cameraTarget.y, requestedCenter.y, 0.1);   
    }
    
    zoom = 1;

    var yZoom = currentScene.scale.height / (maxY - minY);
    var xZoom = currentScene.scale.width / (maxX - minX);

    if(xZoom < yZoom)
    {
        zoom = xZoom;
    }
    else
    {
        zoom = yZoom;
    }

    var requestedZoom = zoom * 0.9;

    if(forceZoom)
    {
        camera.setZoom(requestedZoom);
    }
    else
    {
        camera.setZoom(Phaser.Math.Linear(camera.zoom, requestedZoom, 0.1));
    }

    distanceToCameraTarget = new Phaser.Math.Vector2(cameraTarget.x, cameraTarget.y).distance(new Phaser.Math.Vector2(camera.scrollX, camera.scrollY));

    if(Math.abs(camera.zoom - requestedZoom) < 0.001 && distanceToCameraTarget < 501)
    {
        centeringAndZooming = false;
    }
}

/**
*   Called when user clicks "GO" or play buttons, or other produces other input indicating that animation should begin.
*   In most cases, passes control to animateFractal()
*/
function play()
{
    buttonProcess.blur();
    buttonGo.blur();
    document.getElementById("buttonPlay").blur();
    instructionStringButton.style.display = '';

    if(modeSelect.value == "lindenmayer")
    {
        checkLindenmayerAnimationStyle();
    }
    else if(modeSelect.value == "prime")
    {
        checkPrimeAnimationStyle();
    }

    if(animationStyle > 0)
    {
        requestForceCenter = true;
        requestForceZoom = true;
        animateFractal();
    }
    else
    {
        currentIteration = 0;
        animatingLine = true;
    }
}

/**
*   Called by play(). 
*/
function animateFractal()
{
    timeBetweenDraws = 10;

    prepForFractalAnimation();

    scaleDIV.parentElement.children[0].innerHTML = "Instruction String Scale Factor:"
    scaleDIV.innerHTML = "";
    
    scaleDIV.innerHTML += "0: N/A";
    instructionStringContainerText.innerHTML = "<p>Started with: " + instructionString + "</p>"; 

    if(animationStyle == 1)
    {
        for(var i = 0; i < numIterations; i++)
        {
            updateIterationInformation(i + 1);
        }
    
        stringLengthDIV.parentElement.children[0].innerHTML = "Final Instruction String Length: ";
        stringLengthDIV.innerHTML = instructionString.length + " characters";
    }

    animatingLine = true;
    
    if(angleSum == 0)
    {
        requestForceCenter = true;
        requestForceZoom = true;
    }
    else
    {
        requestForceCenter = false;
        requestForceZoom = false;
    }
}

/**
*   Called by animateFractal()
*/
function prepForFractalAnimation()
{
    lineForFractalPart.clear();
    clearLine();

    box.visible = false;
    marker.visible = false;
    cameraTarget.visible = false;

    scaleDIV.innerHTML = "";

    if(animationStyle == 1)
    {
        currentProportion = 0;
    }
    
    incrementDirection = 1;

    getSeedRules();
    
    convertRulesToJSON();

    getNumIterations();

    instructionString = document.getElementById("seed").value;

    updateURL();

    currentIteration = 0;
}

/**
*   Called by update() in animationStyle 0. Moves to next iteration 
*/
function sequenceFractal()
{
    timeBetweenDraws = 1000;
    currentProportion = 1;
    camera.rotation = 0;

    if(currentIteration > numIterations)
    {
        animatingLine = false;
        currentIteration = 0;
        stringLengthDIV.parentElement.children[0].innerHTML = "Final Instruction String Length: ";
        stringLengthDIV.innerHTML = instructionString.length + " characters";
        return;
    }

    updateIterationInformation(currentIteration);

    animatingLine = true;
}

/**
*   Clear out the array of points to draw, and clear the previously-drawn
*   line from the screen. (If we don't do both, the line drawn on the
*   previous frame will stick around.)
*/
function clearLine(deletePoints)
{
    if(deletePoints == null)
    {
        deletePoints = true;
    }
    
    if(deletePoints)
    {
        lineForFractalPoints = [];
    }

    for(var i = 0; i < lineForFractal.length; i++)
    {
        if(lineForFractal[i] != null)
        {
            lineForFractal[i].clear();
        }
    }
}

/**
*   Actually draw the line through the array of points. (The array is filled by
    drawFigure())
*/
function strokePoints()
{
    if(lineForFractalPoints == null || lineForFractalPoints.length < 2)
    {
        return;
    }

    var numLinesToStroke = lineForFractalPoints.length - 1;
    var numLines = lineForFractal.length;

    var segmentSize = numLinesToStroke / numLines;

    var pointsArrays = [];
    var start = 0;
    var end = 0;

    for(var i = 0; i < numLines; i++)
    {
        start = i * segmentSize;

        end = (i + 1) * segmentSize;
        
        if((end > lineForFractalPoints.length) || ((i == numLines - 1) && end < lineForFractalPoints.length))
        {
            end = lineForFractalPoints.length;
        }

        if(start > 0)
        {
            start--;
        }
        
        pointsArrays.push(lineForFractalPoints.slice(start, end));
    }

    for(var i = 0; i < pointsArrays.length; i++)
    {   
        lineForFractal[i].strokePoints(pointsArrays[i]);
    }
}

/**
*   Called by create() to get the various items we need for drawing to the canvas
*   ready to go.
*/
function setupDrawingElements()
{
    /* Get the main line for drawing the figure set up */
    setLineForFractal(1);

    /* Set up the marker that lineFigure will follow */
    marker = currentScene.add.image(100,100,'marker');
    marker.visible = false;
    marker.setScale(1,1);
    marker.setAngle(0);

    cameraTarget = currentScene.add.image(100,100,'marker');
    marker.visible = false;
    cameraTarget.setScale(1,1);
    cameraTarget.setAngle(0);
    
    box = currentScene.add.image(100,100,'box');
    box.setScale(0.5,0.5);
    box.setAngle(0);
    box.visible = false;

    lineForDrawing = currentScene.add.graphics();
    lineForDrawing.lineStyle(1, currentColor);

    lineForFractalPart = currentScene.add.graphics();
    lineForFractalPart.lineStyle(drawingLineThickness, currentColor);
}

/**
*   In Lindenmayer mode, the user can either enter characters into the "seed" and
*   "replacement rules" textboxes, then set up the required interpretation rules,
*   or they can click on a textbox and then draw on the canvas to have the app
*   automatically generate a string and set up the interpretation rules. So,
*   the app needs to both be able to convert drawings to replacement and 
*   interpretation rules, but to convert replacement and interpretation rules
*   to drawings. This function does the latter.
*/
function drawTextboxString(stringFromTextbox)
{
    if(animatingLine)
    {
        return;
    }

    if(stringFromTextbox == null || stringFromTextbox.length == 0)
    {
        return;
    }
    
    clearLine();
    checkRules();
    convertRulesToJSON();

    lineForFractalPartPoints = [];
    lineForFractalPart.clear();

    if(colorMode == 2)
    {
        currentColor = colorBlack;
    }
    else
    {
        currentColor = colorWhite;
    }

    lineForFractalPart.lineStyle(drawingLineThickness, currentColor);

    marker.rotation = 0;
    marker.x = camera.x + 200;
    marker.y = camera.y + 200;

    lineForFractalPartPoints.push(new Phaser.Geom.Point(marker.x, marker.y));

    var meanX = marker.x;
    var meanY = marker.y;
    minX = 100000;
    maxX = -100000;
    minY = 100000;
    maxY = -100000;

    for(var i = 0; i < stringFromTextbox.length; i++)
    {
        currentLetter = stringFromTextbox.charAt(i);
        currentRule = interpretationRulesJSON[currentLetter];

        if(currentRule != null)
        {
            switch(currentRule[0])
            {
                case 'forward':
                    marker.setPosition(marker.x + Math.cos(marker.rotation) * stepDistanceDrawing, marker.y + Math.sin(marker.rotation) * stepDistanceDrawing);
                    meanX += marker.x;
                    meanY += marker.y;
                    lineForFractalPartPoints.push(new Phaser.Geom.Point(marker.x, marker.y));
                    break;
                case 'back':
                    marker.setPosition(marker.x - Math.cos(marker.rotation) * stepDistanceDrawing, marker.y - Math.sin(marker.rotation) * stepDistanceDrawing);
                    meanX += marker.x;
                    meanY += marker.y;
                    lineForFractalPartPoints.push(new Phaser.Geom.Point(marker.x, marker.y));
                    break; 
                case 'right':
                    marker.angle += Number(currentRule[1]);
                    break;
                case 'left':
                    marker.angle -= Number(currentRule[1]);
                    break;
            }

            if(marker.x < minX)
            {
                minX = marker.x;
            }
            else if(marker.x > maxX)
            {
                maxX = marker.x;
            }

            if(marker.y < minY)
            {
                minY = marker.y;
            }
            else if(marker.y > maxY)
            {
                maxY = marker.y;
            }
        }
    }

    meanX /= lineForFractalPartPoints.length;
    meanY /= lineForFractalPartPoints.length;

    cameraTarget.x = meanX;
    cameraTarget.y = meanY;
    camera.centerOn(meanX, meanY);
    
    zoom = 1;

    var xZoom = 1;
    var yZoom = 1;

    if(maxY - minY > currentScene.scale.height)
    {
        yZoom = currentScene.scale.height / (maxY - minY);
    }
    
    if(maxX - minX > currentScene.scale.width)
    {
        xZoom = currentScene.scale.width / (maxX - minX);
    }

    if(xZoom < yZoom)
    {
        zoom = xZoom;
    }
    else
    {
        zoom = yZoom;
    }

    zoom = zoom * 0.75;

    camera.setZoom(zoom);

    lineForDrawing.lineStyle(1 / zoom, currentColor);

    lineForFractalPart.lineStyle(drawingLineThickness, currentColor);
    box.setScale(0.5 / zoom,0.5 / zoom);

    lineForFractalPart.strokePoints(lineForFractalPartPoints);

    box.visible = true;
    box.x = lineForFractalPartPoints[lineForFractalPartPoints.length - 1].x;
    box.y = lineForFractalPartPoints[lineForFractalPartPoints.length - 1].y;
}

/**
*   In Lindenmayer mode, the user can either enter characters into the "seed" and
*   "replacement rules" textboxes, then set up the required interpretation rules,
*   or they can click on a textbox and then draw on the canvas to have the app
*   automatically generate a string and set up the interpretation rules. So,
*   the app needs to both be able to convert drawings to replacement and 
*   interpretation rules, but to convert replacement and interpretation rules
*   to drawings. This function does the former.
*/
function processDrawing()
{
    if(lineForFractalPartPoints == null || lineForFractalPartPoints.length == 0)
    {
        return;
    }

    marker.x = lineForFractalPartPoints[0].x;
    marker.y = lineForFractalPartPoints[0].y;
    marker.rotation = 0;

    var instructions = [];

    var lastAngle = 0;

    for(var i = 1; i < lineForFractalPartPoints.length; i++)
    {
        
        marker.rotation = Phaser.Math.Angle.Between(marker.x, marker.y, lineForFractalPartPoints[i].x, lineForFractalPartPoints[i].y);

        var newRotation = roundToClosest(marker.angle - lastAngle,0.1); 

        if(newRotation == 0)
        {
            instructions.push("f");
        }
        else
        {
            instructions.push(newRotation);
            instructions.push("f");
        }

        lastAngle = marker.angle;
        marker.x = lineForFractalPartPoints[i].x;
        marker.y = lineForFractalPartPoints[i].y;
    }

    var currentlyUsedSymbols = "";
    var alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    var symbolForForward = "";

    for(var i = 0; i < interpretationRulesArray.length; i++)
    {
        currentlyUsedSymbols += interpretationRulesArray[i][0];
        alphabet =  alphabet.replace(interpretationRulesArray[i][0],"");
        if(symbolForForward == "" && interpretationRulesArray[i][1] == "forward")
        {
            symbolForForward = interpretationRulesArray[i][0];
        }
    }

    if(symbolForForward == "" && alphabet.length > 0)
    {
        if(alphabet.indexOf("f") != -1)
        {
            symbolForForward = "f";
            alphabet = alphabet.replace("f","");
        }
        else if(alphabet.indexOf("g") != -1)
        {
            symbolForForward = "g";
            alphabet = alphabet.replace("g","");
        }
        else if(alphabet.indexOf("F") != -1)
        {
            symbolForForward = "F";
            alphabet = alphabet.replace("F","");
        }
        else if(alphabet.indexOf("G") != -1)
        {
            symbolForForward = "G";
            alphabet = alphabet.replace("G","");
        }
        else
        {
            symbolForForward = alphabet.charAt(0);
        }
    }
    
    if(document.activeElement != null && (document.activeElement.id == "seed" || document.activeElement.className == "ruleTextbox"))
    {
        for(var i = 0; i < instructions.length; i++)
        {
            if(instructions[i] == "f")
            {
                if(i == 0)
                {
                    document.activeElement.value = symbolForForward;
                }
                else
                {
                    document.activeElement.value += symbolForForward;
                }
                
                addRulesFor([symbolForForward,symbolForForward + "_1_0"]);
            }
            else
            {
                var newTurn = true;
                var symbolForTurn = "";
                var direction = "right";

                if(instructions[i] > 180)
                {
                    instructions[i] = (360 - instructions[i]);
                    direction = "left";
                }
                else if(instructions[i] < -180)
                {
                    instructions[i] = (360 + instructions[i]);
                }

                if(instructions[i] < 0)
                {
                    direction = "left";
                    instructions[i] = -1 * instructions[i];
                }

                for(var j = 0; j < interpretationRulesArray.length; j++)
                {
                    if(direction == interpretationRulesArray[j][1] && instructions[i] == interpretationRulesArray[j][2])
                    {
                        newTurn = false;
                        symbolForTurn = interpretationRulesArray[j][0];
                        break;
                    }
                }

                if(newTurn)
                {   
                    if(symbolForTurn == "")
                    {
                        if(direction == "right")
                        {
                            if(alphabet.indexOf("r") != -1)
                            {
                                symbolForTurn = "r";
                                alphabet = alphabet.replace("r","");
                            }
                            else if(alphabet.indexOf("p") != -1)
                            {
                                symbolForTurn = "p";
                                alphabet = alphabet.replace("p","");
                            }
                            else if(alphabet.indexOf("R") != -1)
                            {
                                symbolForTurn = "R";
                                alphabet = alphabet.replace("R","");
                            }
                            else if(alphabet.indexOf("P") != -1)
                            {
                                symbolForTurn = "P";
                                alphabet = alphabet.replace("P","");
                            }
                            else
                            {
                                symbolForTurn = alphabet.charAt(0);
                            }
                        }
                        else
                        {
                            if(alphabet.indexOf("l") != -1)
                            {
                                symbolForTurn = "l";
                                alphabet = alphabet.replace("l","");
                            }
                            else if(alphabet.indexOf("n") != -1)
                            {
                                symbolForTurn = "n";
                                alphabet = alphabet.replace("n","");
                            }
                            else if(alphabet.indexOf("L") != -1)
                            {
                                symbolForTurn = "L";
                                alphabet = alphabet.replace("L","");
                            }
                            else if(alphabet.indexOf("N") != -1)
                            {
                                symbolForTurn = "N";
                                alphabet = alphabet.replace("N","");
                            }
                            else
                            {
                                symbolForTurn = alphabet.charAt(0);
                            }
                        }
                    }
                }

                if(i == 0)
                {
                    document.activeElement.value = symbolForTurn;
                }
                else
                {
                    document.activeElement.value += symbolForTurn;
                }

                if(direction == "right")
                {
                    addRulesFor([symbolForTurn, symbolForTurn + "_3_" + instructions[i]]);
                }
                else
                {
                    addRulesFor([symbolForTurn, symbolForTurn + "_4_" + Math.abs(instructions[i])]);
                }
            }
        }

        if(document.activeElement.className == "ruleTextbox")
        {
            updateReplacementRule(document.activeElement.id);
        }
        else
        {
            getSeedRules();
        }
    }

    drawTextboxString(document.activeElement.value);
}

/**
* In order for the user to be able to draw on the canvas (see processDrawing()), we need
* to tell the app what to do when the user does things like clicking and dragging on the canvas
*/
function setupCanvasListeners()
{
    currentScene.input.on('pointerdown', function(pointer)
    {
        if(document.activeElement.id != "seed" && document.activeElement.className != "ruleTextbox")
        {
            return;
        }

        // If the user clicks somewhere on the Canvas
        if(pointer.x > 0 && pointer.x < game.canvas.width)
        {
            box.visible = true;

            var pointerX = pointer.x;
            var pointerY = pointer.y; 

            if(lineForFractalPartPoints == null || lineForFractalPartPoints.length == 0)
            {
                box.x = pointerX;
                box.y = pointerY;

                cameraTarget.x = box.x;
                cameraTarget.y = box.y;

                marker.x = pointerX;
                marker.y = pointerY;
                marker.rotation = 0;

                lineForDrawingPoints = [new Phaser.Geom.Point(pointerX, pointerY)];
                
                lineForFractalPartPoints = [new Phaser.Geom.Point(pointerX, pointerY)];
            }
            else
            {
                box.x = lineForFractalPartPoints[lineForFractalPartPoints.length - 1].x;
                box.y = lineForFractalPartPoints[lineForFractalPartPoints.length - 1].y;

                marker.x = lineForFractalPartPoints[lineForFractalPartPoints.length - 1].x;
                marker.y = lineForFractalPartPoints[lineForFractalPartPoints.length - 1].y;
                marker.rotation = 0;

                lineForDrawingPoints = [new Phaser.Geom.Point(lineForFractalPartPoints[lineForFractalPartPoints.length - 1].x, lineForFractalPartPoints[lineForFractalPartPoints.length - 1].y)];
                lineForDrawingPoints.push([new Phaser.Geom.Point(pointerX, pointerY)]);
            }
            newLineSegment = true;
        }
    }, currentScene);
    
    currentScene.input.on('pointermove', function (pointer)
    {
        // If mouse is dragging
        if(document.activeElement.id != "seed" && document.activeElement.className != "ruleTextbox")
        {
            return;
        }

        if(pointer.isDown && pointer.x > 0 && pointer.x < game.canvas.width)
        {
            var pointerX = isNaN(pointer.worldX) ? pointer.x : pointer.worldX;
            var pointerY = isNaN(pointer.worldY) ? pointer.y : pointer.worldY;

            box.x = pointerX;
            box.y = pointerY;

            if(lineForDrawingPoints.length == 1)
            {
                lineForDrawingPoints.push(new Phaser.Geom.Point(pointerX, pointerY));
            }
            else if(lineForDrawingPoints.length > 1)
            {
                lineForDrawingPoints[1] = new Phaser.Geom.Point(pointerX, pointerY);
            }

            lineForDrawing.clear();
            lineForDrawing.strokePoints(lineForDrawingPoints);

            marker.rotation = Phaser.Math.Angle.Between(marker.x, marker.y, pointerX, pointerY);
            marker.rotation = roundToClosest(marker.rotation, Math.PI / 12);

            var newPoint = new Phaser.Geom.Point(marker.x + Math.cos(marker.rotation) * stepDistanceDrawing, marker.y + Math.sin(marker.rotation) * stepDistanceDrawing);

            if(newLineSegment)
            {
                lineForFractalPartPoints.push(newPoint);
                newLineSegment = false;
            }
            else
            {
                lineForFractalPartPoints[lineForFractalPartPoints.length - 1].x = newPoint.x;
                lineForFractalPartPoints[lineForFractalPartPoints.length - 1].y = newPoint.y; 
            }

            lineForFractalPart.clear();
            lineForFractalPart.lineStyle(drawingLineThickness, currentColor);
            lineForFractalPart.strokePoints(lineForFractalPartPoints);
        }
    });

    currentScene.input.on('pointerup', function (pointer)
    {
        if(document.activeElement.id != "seed" && document.activeElement.className != "ruleTextbox")
        {
            return;
        }

        lineForDrawing.clear();
        
        if(pointer.x > 0 && pointer.x < game.canvas.width)
        {
            box.x = lineForFractalPartPoints[lineForFractalPartPoints.length - 1].x;
            box.y = lineForFractalPartPoints[lineForFractalPartPoints.length - 1].y;

            marker.x = lineForFractalPartPoints[lineForFractalPartPoints.length - 1].x;
            marker.y = lineForFractalPartPoints[lineForFractalPartPoints.length - 1].x;
            marker.rotation = 0;

            lineForDrawingPoints = [new Phaser.Geom.Point(pointer.x, pointer.y)];
            newLineSegment = false;
        }

        processDrawing();
    }, currentScene);

    var controlButtons = document.getElementById("controlButtons");
    controlButtons.style.visibility = 'hidden';

    controlButtons.addEventListener('mouseover', event => 
    {
        if(okayToShowControlButtons)
        {
            controlButtons.style.visibility = 'visible';
        }
        
        event.preventDefault();
    });

    controlButtons.addEventListener('mouseleave', event => 
    {
        controlButtons.style.visibility = 'hidden';
        event.preventDefault();
    });

    currentScene.input.on('gameover', function (pointer)
    {
        if(okayToShowControlButtons)
        {
            controlButtons.style.visibility = 'visible';
        }
    });

    currentScene.input.on('gameout', function (pointer)
    {
        controlButtons.style.visibility = 'hidden';
    });
}

/**
*   Converts the rules created by the user (in Lindenmayer mode) into URL search parameters, so that users can share
*   the fractals they find with each other.
*/
function updateURL()
{
    var url = new URL(window.location.href);

    var initialSeed = document.getElementById("seed").value;

    url.searchParams.set("seed", initialSeed);

    url.searchParams.set("it", numIterations);

    var ruleString = "";

    for(var i = 0; i < replacementRulesArray.length; i++)
    {
        ruleString = replacementRulesArray[i][1];

        if(interpretationRulesArray[i][2] == null)
        {
            interpretationRulesArray[i][2] = 0;
        }

        switch(interpretationRulesArray[i][1])
        {
            case "nothing":
                ruleString += "_0_0";
                break;
            case "forward":
                ruleString += "_1_0";
                break;
            case "back":
                ruleString += "_2_0";
                break;
            case "right":
                ruleString += "_3_" + interpretationRulesArray[i][2];
                break;
            case "left":
                ruleString += "_4_" + interpretationRulesArray[i][2];
                break;
        }
        
        url.searchParams.set(replacementRulesArray[i][0], ruleString);
    }

    window.history.replaceState(null,null,url);
}

/**
*   Converts the URL search parameters to rules for Lindenmayer mode fractals, so that users can share
*   the fractals they find with each other
*/
function processURLParams()
{
    var url = new URL(window.location.href);

    var entries = url.searchParams.entries()
    
    document.getElementById("degrees").checked = true;
    radians = false;
    replacementRulesArray = [];
    interpretationRulesArray = [];
    
    for(var entry of entries)
    {
        if(entry[0]=="seed")
        {
            document.getElementById("seed").value = entry[1];
            instructionString = entry[1];
        }
        else if(entry[0]=="it")
        {
            numIterations = Number(entry[1]);
            if(isNaN(numIterations))
            {
                numIterations = 1;
            }

            document.getElementById("iterations").value = numIterations;
        }
        else if(typeof(entry[0]) == "string" && entry[0].length == 1)
        {
            addRulesFor(entry);
        }
    }
}

/** Process the fractal presets so users can select them from the presets menu.
 *  Called by create().
 *  This function and processCSV() are based on a user-provided example
 *  from StackOverflow (if I recall correctly) */
async function loadPresets()
{
    /* We're about to try to access a file, but might not be able to */
    try 
    {
        /*  Since the CSV file containing the information for the built-in fractals is in another file
            on the server, we have to send an HTML request to access it, and wait for a response */
		let fileText = await processCSV();

        /* Assuming we received the file, split it into separate lines*/
        var lines = fileText.split("\n");

        var currentLine;

        /* Each line in the CSV file contains the information for one fractal. */
        for(var i = 0; i < lines.length; i++)
        {
            /*  Each line in the CSV contains three cells: the fractal's type, its name, and its instruction string 
                instructionString + rules. They are separated by commas, so split up the current line to get the three parts. */
            currentLine = lines[i].split(",");

            /*  If the current fractal belongs to a new type of fractal . . .*/
            if(!presets.hasOwnProperty(currentLine[0]))
            {
                /*  Make sure there is an entry in the presets dictionary for this type of fractal */
                if(presets[currentLine[0]] == null)
                {
                    presets[currentLine[0]] = [];
                }
            }

            /* Now set up the details for this particular fractal. */
            var fractal = {};
            fractal["name"] = currentLine[1]; 
            fractal["code"] = currentLine[2];

            /* Then add the details for this fractal to the dictionary of presets*/
            presets[currentLine[0]].push(fractal);
        }

        /*  Now that all the preset fractals have been loaded, set up the menu so that
            the user can select them */
        selectPresetsCategories();
	}
	catch(e) 
    {
        /* If we weren't able to access the CSV file, let the user know */
		alert(e.message);
	}
}

/** Called by loadPresets(). Gets the fractal presets file.
 *  This function and loadPresets() are based on a user-provided example
 *  from StackOverflow (if I recall correctly) 
 *  @returns {string} The text of the presets CSV */
async function processCSV()
{
    /*  Send a request to access the CSV with the info for the built-in fractals in it*/
    let response = await fetch("presets/lindenmayer0.csv");
	
    /*  If the server denies our request . . . */
	if(response.status != 200) 
    {
		throw new Error("Could not load fractal presets. Sorry!"); // . . . let the user know
	}

	let fileText = await response.text(); // Extract the text from the file

	return fileText;
}

/** Set up the fractal selection menu so users can pick a type of fractal 
 *  (and then a specific fractal from that type).
 *  Called by loadPresets(), as well as by user-triggered events involving
 *  the fractal selection menu */
function selectPresetsCategories()
{
    /* Get a reference to the dropdown menu from which the user will select preset fractals*/
    var presetSelect = document.getElementById("presetSelect");

    presetSelect.innerHTML = ""; // Clear the contents of the menu

    const parser = new DOMParser(); // We will be creating new HTML elements from text, and need something to parse that text

    if(presetSelect != null)
    {
        /* The various categories of fractals were created in loadPresets(). Sort them alphabetically */
        var categories = Object.entries(presets).sort();

        /* Add an entry to the top of the menu to tell the user what to do with the menu */
        presetSelect.appendChild(parser.parseFromString(`<option value="chooseType">Choose a Fractal Type</option>`,'text/html').body.children[0]);

        /* Now add entries for the various categories of fractal */
        for(var i = 0; i < categories.length; i++)
        {
            /*  We want the Classic Fractals and Tillman's Favorites categories to be at the top of the list,
                with the other categories sorted alphabetically below them. */
            if(categories[i][0] == "Classic Fractals")
            {
                /* If all that we have added to the menu is the "Choose a fractal type" instruction . . . */
                if(presetSelect.childNodes.length == 1)
                {
                    /* . . . then we can just add the "Classic Fractals" entry */
                    presetSelect.appendChild(parser.parseFromString(`<option value="` + categories[i][0] + `">` + categories[i][0] + `</option>`,'text/html').body.children[0]);
                }
                else
                {
                    /* But if other entries have been added already, then we have to insert the "Classic Fractals" entry at the right spot */
                    presetSelect.insertBefore(parser.parseFromString(`<option value="` + categories[i][0] + `">` + categories[i][0] + `</option>`,'text/html').body.children[0], presetSelect.childNodes[1]);
                }
            }
            else if(categories[i][0] == "Tillman's Favorites")
            {
                /* We want "Tillman's Favorites" to end up being listed after "Classic Fractals" */
                if(presetSelect.childNodes.length <= 2)
                {
                    presetSelect.appendChild(parser.parseFromString(`<option value="` + categories[i][0] + `">` + categories[i][0] + `</option>`,'text/html').body.children[0]);
                }
                else
                {
                    presetSelect.insertBefore(parser.parseFromString(`<option value="` + categories[i][0] + `">` + categories[i][0] + `</option>`,'text/html').body.children[0], presetSelect.childNodes[2]);
                }
            }
            else if(categories[i][0] != null && categories[i][0] != "")
            {
                /* We want to add the other categories of fractal to the menu as they show up */
                presetSelect.appendChild(parser.parseFromString(`<option value="` + categories[i][0] + `">` + categories[i][0] + `</option>`,'text/html').body.children[0]);
            }
        }

        /*  Insert divider lines into the menu to keep the groups of options clear */
        presetSelect.insertBefore(parser.parseFromString(`<option disabled>--------------------------</option>`,'text/html').body.children[0], presetSelect.childNodes[1]);
        presetSelect.insertBefore(parser.parseFromString(`<option disabled>--------------------------</option>`,'text/html').body.children[0], presetSelect.childNodes[4]);   
    }

    /*  If we haven't already set up the listener for the fractal selection menu, we need to do that*/
    if(menuNeedsListener)
    {
        menuNeedsListener = false;

        /*  JavaScript can add "listeners" to HTML elements, so that when the user does something to those elements
            (e.g., clicking on them), a function can be called. In this case, we want to listen for when the 
            user changes the currently-selected option in the menu*/
        presetSelect.addEventListener('change', () =>
        {
            animatingLine = false; // Stop the animation, if ther is any going on.

            clearLine(); // Clear the line, to prepare for drawing a new fractal

            /*  If the user clicked the option to go back to the list of fractal categories . . .*/
            if(presetSelect.value == "back")
            {
                selectPresetsCategories(); // Add the fractal categories to the menu
                /*  Set the menu to be "open," displaying all the fractal categories. Otherwise, the user will
                    have to click the menu again to open it and that would be annoying. */
                presetSelect.setAttribute("size", presetSelect.options.length - 1);
            }   
            else if(presetSelect.options[0].value == "chooseType")
            {
                /*  If the user clicked one of the fractal categories, then we need to show all the
                    fractals in that category*/
                selectPresetsFractals();
                /*  We don't want the user to have to click the menu again, so set it to be open and to 
                    display all the fractals in the selected category. */
                presetSelect.setAttribute("size", presetSelect.options.length);
            }
            else
            {
                /*  If the user has selected a specific fractal, shrink the menu so only the currently-
                    selected fractal's name is shown.*/
                presetSelect.setAttribute("size", 1);
                
                /*  Then, find and load the fractal that was selected. We will do this in a roundabout way:
                    The app has the ability to process URL "search parameters" as instructions for making
                    a fractal, so that users can share the fractals they find with each other just by 
                    sending each other a link. That is, to enable users to share fractals with each other,
                    the app was designed to parse the part of the URL after the "?" (if there is one)
                    as the starting string and rule set for a fractal. Now, as it happens, all the preset
                    fractals are stored in a CSV with their category name, individual fractal name, and a 
                    string containing the fractal's starting string and rule set in URL search parameters
                    form. So, we need to get that string (which was loaded from the CSV by loadPresets())
                    and inject it into the page's current URL. Then we can process the search parameters
                    from the URL and load the preset fractal in the same way we would load a fractal that
                    had been shared via URL.*/
                for(var i = 0; i < presets[currentFractalCategory].length; i++)
                {
                    /* If we have found the fractal the user selected. */
                    if(presets[currentFractalCategory][i]["name"] == presetSelect.value)
                    {
                        /*  Get the current URL, ignoring any search parameters than may have been included.
                            For example, get the "https://chambergon.com/fractal/" part of 
                            "https://chambergon.com/fractal/?instructionString=f&f=flg&g=frg&..." */
                        var url = new URL(window.location.href.split("?")[0]);

                        /*  Get the code defining the fractal. I believe we could just inject that code into
                            the current URL now. However, I have elected to deconstruct it and reconstruct it
                            out of an abundance of caution. That way, if the text of the CSV ever becomes 
                            corrupt, we won't simply be injecting a garbled string into the URL. */
                        var newParams = presets[currentFractalCategory][i]["code"].split("&");

                        /*  A valid set of parameters for a fractal will have at least three parts. So,
                            if we got fewer than three parts from spliting the parameters, we should quit */
                        if(newParams.length < 3)
                        {
                            break;
                        }

                        var goodToGo = true; // Keep track of whether any errors have been detected

                        /*  Go through each segment and find its parts.*/
                        for(var j = 0; j < newParams.length; j++)
                        {
                            /* Each parameter should have two parts, separated by an "=" sign */
                            newParams[j] = newParams[j].split("=");

                            if(newParams[j].length == 2)
                            {
                                /* Add the parameter we just processed to our new URL */
                                url.searchParams.set(newParams[j][0],newParams[j][1]);
                            }
                            else
                            {
                                /* We found a parameter that didn't have the appropriate number of parts. */
                                goodToGo = false;
                                break;
                            }
                        }

                        /* If no errors were detected in processing the fractal's parameters . . .*/
                        if(goodToGo)
                        {
                            /* Clear the app's memory */
                            interpretationRulesArray = [];
                            replacementRulesArray = [];

                            /* Clear the app's display */
                            document.getElementById("replacementRules").innerHTML = "";
                            document.getElementById("interpretationRules").innerHTML = "";
    
                            /* Update the current URL to include the parameters for the fractal the user selected*/
                            window.history.replaceState(null,null,url);
                            processURLParams(); // Load the fractal's parameters into memory
                        }

                        break; // We found the fractal we were looking for, and thus can quit looking
                    }
                }
            }
        });

        /* If the menu ever loses focus, shrink it down so it only displays one line*/
        presetSelect.addEventListener('blur', () =>
        {
            presetSelect.setAttribute("size", 1);
        });
    }
}

/** Set up the menu so the user can pick a specific fractal from whatever type they had
 *  just selected.
 *  Called when user selects a fractal category from the presets menu. */
function selectPresetsFractals()
{
    /* Get a reference to the dropdown menu from which the user will select preset fractals*/
    var presetSelect = document.getElementById("presetSelect");

    currentFractalCategory = presetSelect.value; // Find out what fractal category the user selected

    presetSelect.innerHTML = ""; // Clear the menu

    const parser = new DOMParser(); // We need to turn strings of text into HTML elements

    /* If we found the menu . . . */
    if(presetSelect != null)
    {
        var categories = Object.entries(presets); // Load the fractal categories in a way we can loop through

        /* Add an instruction and an option to return to the category select version of the menu*/
        presetSelect.appendChild(parser.parseFromString(`<option value="chooseFractal">Choose a Fractal</option>`,'text/html').body.children[0]);
        presetSelect.appendChild(parser.parseFromString(`<option value="back"><-Back</option>`,'text/html').body.children[0]);
        
        /* Now, find the category the user selected, so we can add the fractals from that category */
        for(var i = 0; i < categories.length; i++)
        {
            /* If the current category matches the category we were looking for */
            if(categories[i][0] == currentFractalCategory)
            {
                /*  Sort the fractals in this category by name, in alphabetical order. (I believe I owe this code to a 
                    user on StackOverflow) */
                categories[i][1].sort((a, b) => (a["name"] > b["name"]) ? 1 : ((b["name"] > a["name"]) ? -1 : 0));

                /*  Now, go through the array of fractals for this category, and add entries for them to the menu
                    (so long as they don't have an empty name; sometimes empy rows can end up in the CSV, and don't
                    actually represent fractals)*/
                for(var j = 0; j < categories[i][1].length; j++)
                {
                    if(categories[i][1][j]["name"] != "")
                    {
                        presetSelect.appendChild(parser.parseFromString(`<option value="` + categories[i][1][j]["name"] + `">` + categories[i][1][j]["name"] + `</option>`,'text/html').body.children[0]);
                    }
                }
                break;
            }   
        }
    }

    showDIVs("all", true); // Make sure everything is visible to the user
}

/** Get the HTML elements we need to listen to and assign a listener to each. 
 *  Called by create() */
function setupHTMLListeners()
{
    /* See top of file for descriptions of these elements */
    htmlReplacementRulesDIV = document.getElementById("replacementRules");
    htmlInterpretationRulesDIV = document.getElementById("interpretationRules");
    percentDIV = document.getElementById("percent").children[1];
    scaleDIV = document.getElementById("scale").children[1];
    stringLengthDIV = document.getElementById("stringLength").children[1];
    forceCenterZoomBox = document.getElementById("forceCenterZoom");
    iterationsBox = document.getElementById("iterations");
    animateDIV = document.getElementById("animateDIV");
    outputDIV = document.getElementById("output");
    instructionStringContainer = document.getElementById("instructionStringContainer");
    instructionStringContainerText = document.getElementById("instructionStringContainerText");

    /* Get a reference to the textbox in which the user types the instructionString for the instruction string */    
    instructionStringTextbox = document.getElementById("seed");

    if(instructionStringTextbox != null)
    {
        /* Select the instructionString textbox for the user so they can start typing right away */
        instructionStringTextbox.focus();

        /* Filter user inputs so that only letters get through*/
        instructionStringTextbox.addEventListener('beforeinput', event => 
        {            
            if(isStringOkay(event))
            {
                event.preventDefault();
            }
        });

        /* If the user input passed the filter . . . */
        instructionStringTextbox.addEventListener('input', () =>
        {
            /*  We need to see if they entered a new letter, which needs new rules, or if they 
                deleted a letter whose rules also need to be removed*/
            checkRules();

            /*  If we aren't in the middle of an animation, show the user what the string of symbols
                in the textbox looks like when treated as drawing commands */
            if(!animatingLine)
            {
                drawTextboxString(instructionStringTextbox.value);
            }
        });

        /* Same deal here, but this time for when the user clicks on the box*/
        instructionStringTextbox.addEventListener('focus', () =>
        {
            if(!animatingLine)
            {
                drawTextboxString(instructionStringTextbox.value);
            }
        });
    }

    /*  There are a number of buttons that the user can hold down, but JavaScript doesn't have a 
        'buttonHeld' event. Instead, we will listen for when those buttons are pressed and for when they are released
        (and we will listen for when they are released by listening for whenever the user releases the left mouse 
        button). */
    document.body.addEventListener('mouseup', () => 
    {
        userMovingCamera = false;
        userRotatingCamera = false;
        userChangingAnimationSpeed = false;
        userZoomingCamera = false;
        userChangingLineThickness = false;
        userChangingAnimationSpeed = false;
    });

    /* Get the button that the user clicks to view the instruction string panel */
    instructionStringButton = document.getElementById("viewStringButton");

    if(instructionStringButton != null && instructionStringContainer != null)
    {
        /*  If we were able to find both the button to open the instructionStringContainer and the container itself,  
            then whenever the button is pressed, show the container*/
        instructionStringButton.addEventListener('click', () =>
        {
            instructionStringContainer.style.display = '';
            instructionStringContainer.style.visibility = 'visible';
        });
    }

    /*  Get a reference to the button for closing the instruction string panel */
    var closeInstructionStringButton = document.getElementById("closeInstructionStringButton");

    if(closeInstructionStringButton != null  && instructionStringContainer != null)
    {
        /* If we found that button, and the container itself, hide the panel whenever the button is pressed. */
        closeInstructionStringButton.addEventListener('click', () =>
        {
            instructionStringContainer.style.display = 'none';
            instructionStringContainer.style.visibility = 'hidden';
        });
    }

    /* Get a reference to the button the user will use to open the FAQ panel */
    var faqButton = document.getElementById("faqButton");

    if(faqButton != null)
    {
        /* If we found that button, show the FAQ panel whenever the button is clicked */
        faqButton.addEventListener('click', () =>
        {
            document.getElementById("faqContainer").style.display = '';
            document.getElementById("faqContainer").style.visibility = 'visible';
        });
    }

    /* Get a reference to the button the user will use to close the FAQ panel */
    var closeFAQButton = document.getElementById("closeFAQButton");

    if(closeFAQButton != null)
    {
        /* If we found that button, hide the FAQ panel whenever the button is clicked */
        closeFAQButton.addEventListener('click', () =>
        {
            document.getElementById("faqContainer").style.display = 'none';
            document.getElementById("faqContainer").style.visibility = 'hidden';
        });
    }

    /* Get a reference to the button the user will use to open controls panel */
    var controlsButton = document.getElementById("controlsButton");

    if(controlsButton != null)
    {
        /* If we found that button, show the controls panel whenever the button is clicked */
        controlsButton.addEventListener('click', () =>
        {
            document.getElementById("controlsContainer").style.display = '';
            document.getElementById("controlsContainer").style.visibility = 'visible';
        });
    }

    /* Get a reference to the button the user will use to close controls panel */
    var closeControlsButton = document.getElementById("closeControlsButton");

    if(closeControlsButton != null)
    {
        /* If we found that button, hide the controls panel whenever the button is clicked */
        closeControlsButton.addEventListener('click', () =>
        {
            document.getElementById("controlsContainer").style.display = 'none';
            document.getElementById("controlsContainer").style.visibility = 'hidden';
        });
    }

    /* Get a reference to the button the user will use to open the info panel */
    var infoButton = document.getElementById("infoButton");

    if(infoButton != null)
    {
        /* If we found that button, show the info panel whenever the button is clicked */
        infoButton.addEventListener('click', () =>
        {
            document.getElementById("infoContainer").style.display = '';
            document.getElementById("infoContainer").style.visibility = 'visible';
        });
    }

    /* Get a reference to the button the user will use to close the info panel */
    var closeInfoButton = document.getElementById("closeInfoButton");

    if(closeInfoButton != null)
    {
        /* If we found that button, hide the info panel whenever the button is clicked */
        closeInfoButton.addEventListener('click', event =>
        {
            document.getElementById("infoContainer").style.display = 'none';
            document.getElementById("infoContainer").style.visibility = 'hidden';
        });
    }

    /*  There is a checkbox with a label, inside a span, all styled to look like a single button. 
        Get a reference to the checkbox and the span */
    var toolTipsCheckbox = document.getElementById("toolTipsCheckbox");
    var toolTipsCheckboxSpan = document.getElementById("toolTipsCheckboxSpan");

    if(toolTipsCheckboxSpan != null && toolTipsCheckbox != null)
    {
        /* If we found both the checkbox and its span, find out whether the user wants tooltips to be shown or not*/
        toolTipsOn = toolTipsCheckbox.checked;

        /*  We want the span, the label, and the checkbox to function together as a single, clickable button. So, 
            if the user clicks the checkbox directly, or if they click the label for the checkbox, or if they click
            the "whitespace" around the label and check box that is within the borders of the span, we want them
            to get the same effect of toggling tooltips on or off. To make this work, we have to listen for different
            events depending on what the user clicked. */
        toolTipsCheckbox.addEventListener('mouseup', () =>
        {
            /*  If the user clicked the checkbox directly, we can simply read its state to find out if they want
                tooltips to be on or off. However, in clicking the checkbox, they also clicked the span, so the
                next block of code will also be executed. */
            toolTipsOn = toolTipsCheckbox.checked;
        });

        toolTipsCheckboxSpan.addEventListener('click', () =>
        {
            /*  If the user clicked anywhere in the span, we need to register the fact that they wanted to toggle
                the tooltips on or off, then set the state of the checkbox to reflect that fact. */
            toolTipsOn = !toolTipsOn;
            toolTipsCheckbox.checked = toolTipsOn;

            /* If the user just toggled tooltips on, we need to change all the divs that are supposed to have
                tooltips to belong to the "hasToolTip" class.*/
            if(toolTipsCheckbox.checked)
            {             
                /* Get all the elements on the page that belong to the "hadToolTip" class */
                var hadToolTips = document.getElementsByClassName("hadToolTip");

                /* Go through those elements one at a time, changing their class. Once they belong to
                    the 'hasToolTip' class again, the CSS will take care of showing/hiding their tooltips */
                for(var i = 0; i < hadToolTips.length;)
                {
                    var currentToolTipDIV = hadToolTips[i];
                    currentToolTipDIV.classList.remove('hadToolTip');
                    currentToolTipDIV.classList.add('hasToolTip');
                }
            }
            else
            {
                /*  If the user just toggled tool tips off, get a list of all the elements
                    that currently have a tooltip associated */
                var hasToolTips = document.getElementsByClassName("hasToolTip");

                /* Go through those elements and change their classes. Once they are in the 
                    "hadToolTip" class, the CSS will refuse to show their associated tooltips */
                for(var i = 0; i < hasToolTips.length;)
                {
                    var currentToolTipDIV = hasToolTips[i];
                    currentToolTipDIV.classList.remove('hasToolTip');
                    currentToolTipDIV.classList.add('hadToolTip');
                }
            }
        });
    }

    /*  There is a group of buttons that appear when the user hovers the mouse pointer over the canvas. We
        need to assign the appropriate functionality to each. When the boolean values below change to true, this
        will be registered in update(), which will call the appropriate functions.  */

    document.getElementById("buttonRotateLeft").addEventListener('mousedown', () => 
    {
        userRotatingCamera = true;
        userInputDirection = "left";
    });

    document.getElementById("buttonLeft").addEventListener('mousedown', () => 
    {
        userMovingCamera = true;
        userInputDirection = "left";
    });
    
    document.getElementById("buttonUp").addEventListener('mousedown', () => 
    {
        userMovingCamera = true;
        userInputDirection = "up";
    });

    document.getElementById("buttonDown").addEventListener('mousedown', () => 
    {
        userMovingCamera = true;
        userInputDirection = "down";
    });
    
    document.getElementById("buttonRotateRight").addEventListener('mousedown', () => 
    {
        userRotatingCamera = true;
        userInputDirection = "right";
    });
    
    document.getElementById("buttonRight").addEventListener('mousedown', () => 
    {
        userMovingCamera = true;
        userInputDirection = "right";
    });
    
    document.getElementById("buttonZoomIn").addEventListener('mousedown', () => 
    {
        userZoomingCamera = true;
        userInputDirection = "in";
    });
    document.getElementById("buttonZoomOut").addEventListener('mousedown', () => 
    {
        userZoomingCamera = true;
        userInputDirection = "out";
    });

    /* This is a one-time-press button, so we don't need to wait for update() to call the function*/
    document.getElementById("buttonCenter").addEventListener('mousedown', () => 
    {
        fitFractalToScreen();
    });

    document.getElementById("buttonThick").addEventListener('mousedown', () => 
    {
        userChangingLineThickness = true;
        userInputDirection = "up";
    });

    document.getElementById("buttonThin").addEventListener('mousedown', () => 
    {
        userChangingLineThickness = true;
        userInputDirection = "down";
    });

    /*  The following two buttons are also of the "one-time-press" variety, and thus
        we can call their associated function directly */
    document.getElementById("buttonStart").addEventListener('mousedown', () => 
    {
        jumpTo("start");
    });

    document.getElementById("buttonEnd").addEventListener('mousedown', () => 
    {
        jumpTo("end");
    });
    
    document.getElementById("buttonFast").addEventListener('mousedown', () => 
    {
        userChangingAnimationSpeed = true;
        userInputDirection = "faster";
    });
    
    document.getElementById("buttonSlow").addEventListener('mousedown', () => 
    {
        userChangingAnimationSpeed = true;
        userInputDirection = "slower";
    });
    
    /* The play button is also a special case */
    document.getElementById("buttonPlay").addEventListener('click', () => 
    {
        /* If we aren't currently playing an animation, we need to start*/
        if(!animatingLine)
        {
            /* If we had reached the end of the animation, then we should play the animation backward */
            if(currentProportion >= 1)
            {
                incrementDirection = -1;
            }
            else
            {
                incrementDirection = 1; // Otherwise, play the animation forward.
            }

            play(); // Get things ready to play the animation
        }

        paused = false; // If we're playing an animation, the animation isn't paused
    });
    
    /* The pause button is a one-time click, but has an effect only via update() */
    document.getElementById("buttonPause").addEventListener('mousedown', event => 
    {
        /* Don't set paused to true unless we were playing an animation.*/
        if(animatingLine)
        {
            animatingLine = false;
            paused = true;
        }
    });

    if(forceCenterZoomBox != null)
    {
        /*  There is a checkbox the user can click on to request that the animating figure exactly fit the 
            screen on every frame */
        forceCenterZoomBox.addEventListener('click', () => 
        {
            /* If the user toggled that checkbox on, let the update() function know */
            if(forceCenterZoomBox.checked)
            {
                forceCenterZoomBool = true;
            }
            else
            {
                /* If they toggled that checkbox off, let the update() function know */
                forceCenterZoomBool = false;
            }
        });
    }

    /* Options to change the color mode before the next animation frame. */
    document.getElementById("buttonLineColor").addEventListener('click', () => 
    {
        changeColorMode("!");
    });

    document.getElementById("buttonLineWhite").addEventListener('click', () => 
    {
        changeColorMode("@");
    });

    document.getElementById("buttonLineBlack").addEventListener('click', () => 
    {
        changeColorMode("#");
    });

    buttonGo = document.getElementById("buttonGo");

    if(buttonGo != null)
    {
        buttonGo.addEventListener('click', () =>
        {
            play();
        });
    }

    radioButtonsDIV = document.getElementById("angleMeasureButtons");

    if(radioButtonsDIV != null)
    {
        radioButtonsDIV.addEventListener('click', event =>
        {
            switch(event.target.id)
            {
                case "radians":
                    if(!radians)
                    {
                        toggleDegreesRadians();
                    }
                    break;
                case "degrees":
                    if(radians)
                    {
                        toggleDegreesRadians();
                    }
                    break;
            }
        });
    }

    /*  Much of the functionality of the buttons described above can also be accomplished via keyboard shortcuts.
        Some of those involve the shift key, so get a reference to it. */
    shiftKey = currentScene.input.keyboard.addKey('SHIFT');

    /*  I'll be using tools provided by Phaser to get keyboard inputs.
        Here, we'll set up the key that generally means "go backward" */
    currentScene.input.keyboard.on('keydown-COMMA', () =>
    {
        /* The "<" key (shift + comma) jumps you back to the start of the animation */
        if(shiftKey.isDown)
        {
            jumpTo("start");
        }
        else
        {
            /* This key has no effect if we are just showing the sequence of instruction string iterations */
            if(animationStyle == 0)
            {
                return;
            }

            /*  The comma key, on its own, does one of three things. 
                First, if the animation is paused, or hasn't started, it will start the animation, 
                but going backwards */
            if(paused || !animatingLine)
            {
                incrementDirection = -1;
                animatingLine = true;
            }
            else if(animatingLine)
            {
                /* If the animation is playing backward, it will speed up */
                if(incrementDirection == -1)
                {
                    userInputDirection = "faster";
                }
                else
                {
                    /* But if it is playing forward, it will slow down */
                    userInputDirection = "slower";
                }

                /* Changes made here will take effect in update() */
                userChangingAnimationSpeed = true;
            }  
        }
    });

    /* Here, we set up the key that generally means, "go forward" */
    currentScene.input.keyboard.on('keydown-PERIOD', () =>
    {
        /* The period key shouldn't affect the animation if the user is trying to type in a textbox */
        if(document.activeElement.id.includes("seed") || document.activeElement.id.includes("textbox"))
        {
            return;
        }

        /* The ">" key (shift + period) means to jump to the end of the animation */
        if(shiftKey.isDown)
        {
            jumpTo("end");
        }
        else
        {
            /* If the shift key isn't held down and the animation was paused. */
            if(paused)
            {
                /* Start animating forward */
                incrementDirection = 1;
                animatingLine = true;
            }
            else if(!animatingLine)
            {
                /* If the animation wasn't playing, start it up */
                play();
            }
            else
            {
                /* If the animation is playing forward, speed up; if it's playing it backward, slow down */
                if(incrementDirection == 1)
                {
                    userInputDirection = "faster";
                }
                else
                {
                    userInputDirection = "slower";
                }

                /* Changes made here will be put into effect in update() */
                userChangingAnimationSpeed = true;
            }
        }
    });

    /*  So that the user can slow down or speed up the animation by holding down the comma or period keys
        we need to keep track of when they release those keys. */
    currentScene.input.keyboard.on('keyup-COMMA', () =>
    {
        userChangingAnimationSpeed = false;
    });

    currentScene.input.keyboard.on('keyup-PERIOD', () =>
    {
        userChangingAnimationSpeed = false;
    });

    /* Allow the user to close the various pannels by hitting the esc key*/
    currentScene.input.keyboard.on('keyup-ESC', () =>
    {
        document.getElementById("controlsContainer").style.display = 'none';
        document.getElementById("controlsContainer").style.visibility = 'hidden';
        document.getElementById("infoContainer").style.display = 'none';
        document.getElementById("infoContainer").style.visibility = 'hidden';
        document.getElementById("faqContainer").style.display = 'none';
        document.getElementById("faqContainer").style.visibility = 'hidden';
        instructionStringContainer.style.display = 'none';
        instructionStringContainer.style.visibility = 'hidden';
    });

    /* Allow the user to pause and unpause the animation with the space bar*/
    currentScene.input.keyboard.on('keyup-SPACE', () =>
    {
        if(animatingLine)
        {
            animatingLine = false;
            paused = true;
        }
        else if(paused)
        {
            animatingLine = true;
            paused = false;
        }
    });

    /*  Pressing enter while not in a textbox or other input element should jump the camera to be
        fully centered on the figure and fully zoomed in */
    currentScene.input.keyboard.on('keydown-ENTER', () =>
    {
        if(document.activeElement.tagName != "INPUT")
        {
            fitFractalToScreen();
        }
    });

    /*  Pressing the right arrow key should either move the camera right or rotate the image right,
        depending on whether the user is holding down the shift key */
    currentScene.input.keyboard.on('keydown-RIGHT', () =>
    {
        if(shiftKey.isDown)
        {
            userRotatingCamera = true;
            userMovingCamera = false;
        }
        else
        {
            userMovingCamera = true;
            userRotatingCamera = false;
        }

        userInputDirection = "right";
    });

    /*  When the user releases the right arrow key, stop moving or rotating the camera */
    currentScene.input.keyboard.on('keyup-RIGHT', () =>
    {
        userRotatingCamera = false;
        userMovingCamera = false;
    });

    /*  The same goes for the left arrow key */
    currentScene.input.keyboard.on('keydown-LEFT', () =>
    {
        if(shiftKey.isDown)
        {
            userRotatingCamera = true
        }
        else
        {
            userMovingCamera = true;
        }

        userInputDirection = "left";
    });

    currentScene.input.keyboard.on('keyup-LEFT', () =>
    {
        userRotatingCamera = false;
        userMovingCamera = false;
    });

    /*  The up and down arrow keys move the camera up and down, or zoom in and out, depending on 
        whether the user is holding down the shift key */
    currentScene.input.keyboard.on('keydown-UP', () =>
    {
        if(shiftKey.isDown)
        {
            userZoomingCamera = true;
            userInputDirection = "in";
        }
        else
        {
            userMovingCamera = true;
            userInputDirection = "up";
        }
    });

    currentScene.input.keyboard.on('keyup-UP', () =>
    {
        userZoomingCamera = false;
        userMovingCamera = false;
    });

    currentScene.input.keyboard.on('keydown-DOWN', () =>
    {
        if(shiftKey.isDown)
        {
            userZoomingCamera = true;
            userMovingCamera = false;
            userInputDirection = "out";
        }
        else
        {
            userMovingCamera = true;
            userZoomingCamera = false;
            userInputDirection = "down";
        }
    });

    currentScene.input.keyboard.on('keyup-DOWN', () =>
    {
        userZoomingCamera = false;
        userMovingCamera = false;
    });

    /*  The user can make the displayed line thicker or thinner using the right and left square bracket keys.
        They can change whether the line is drawn in color on a black background, in white on a black background, 
        or in black on a white background, by holding down shift and pressing the 1, 2, or 3 keys. */
    currentScene.input.keyboard.on('keydown', event =>
    {
        switch(event.key)
        { 
            case "]":
                userChangingLineThickness = true;
                userInputDirection = "up";
                break;
            case "[":
                userChangingLineThickness = true;
                userInputDirection = "down";
                break;
            case "!": case "@": case "#":
                changeColorMode(event.key);
            break;
        }
    });

    currentScene.input.keyboard.on('keyup', event =>
    {
        switch(event.key)
        { 
            case "]": case "[":
                userChangingLineThickness = false;
                break;
        }
    });

    /*  Allow the user to change back and forth between Lindenmayer mode and Prime Numbers mode
        through the dropdown menu toward the top of the page */
    modeSelect = document.getElementById("mode");

    if(modeSelect != null)
    {
        modeSelect.addEventListener('change', () =>
        {
            checkMode();
        });
    }

    /* In Lindenmayer mode, allow users to change animationStyle using the dropdown menu beside the "GO" button */
    lindenmayerAnimationSelect = document.getElementById("lindenmayerAnimationStyle");

    if(lindenmayerAnimationSelect != null)
    {
        lindenmayerAnimationSelect.addEventListener('change', () =>
        {
            checkLindenmayerAnimationStyle();
        });
    }

    /* In Prime Numbers mode, allow users to change animationStyle using the dropdown above the checkboxes. */
    primeAnimationSelect = document.getElementById("primeAnimationStyle");

    if(primeAnimationSelect != null)
    {
        primeAnimationSelect.addEventListener('change', () =>
        {
            checkPrimeAnimationStyle();
        });
    }

    /* Keep the page from being unnecessarily cluttered, to start */
    showDIVs("all", false);

    /* Get all the checkboxes for the prime numbers used in Prime Numbers mode*/
    primeCheckboxes = document.getElementsByClassName("primeCheckbox");

    /*  The app will suggest a maximum line length in Prime Numbers mode, depending on which 
        prime numbers have been selected. So, whenever they check or uncheck one of the boxes
        we will need to recalculate the optimal number line length. For this to occur, we need
        to add a listener to each of the check boxes */
    for(var i = 0; i < primeCheckboxes.length; i++)
    {
        primeCheckboxes[i].addEventListener('change', () =>
        {
            getNumberLineLengthSuggestion();
        });
    }

    /*  When the user clicks the "Select All" checkbox, we need to check all the prime number checkboxes
        and recalculate the optimal number line length */
    var selectAll = document.getElementById("selectAll");

    if(selectAll != null)
    {
        selectAll.addEventListener('change', event =>
        {
            for(var i = 0; i < primeCheckboxes.length; i++)
            {
                primeCheckboxes[i].checked = selectAll.checked;
            }

            getNumberLineLengthSuggestion();
        });
    }

    /*  In Prime Numbers mode, animationStyle 3, users are given two textboxes per
        prime number, one to specify where the angle the animation should start with
        for that prime number, and the other to specify what angle the animation
        should end with for that prime number. In animationStyle 4, the "end angle"
        boxes are used to specify how quickly the line should turn for each prime
        number. */
    angleEndBoxes = document.getElementsByClassName("primeEndBox");

    /*  We need to set up the listeners for all those boxes */
    for(var i = 0; i < angleEndBoxes.length; i++)
    {
        var currentBox = angleEndBoxes[i];

        /*  Filter user inputs so they can only enter decimals and fractions */
        currentBox.addEventListener('beforeinput', event => 
        {            
            if(isAngleOkay(event))
            {
                event.preventDefault();
            }
        });

        /*  If what the user entered passed the filter, we need to do a number of things */
        currentBox.addEventListener('change', event =>
        {            
            /*  Get the textbox into which the user entered a number, along with the prime number
                checkbox to which it belongs */
            var currentBoxValue = document.getElementById(event.target.id).value;
            
            var currentCheck = document.getElementById(event.target.id).parentElement.children[1];

            /*  If the user entered a number into the textbox, check the checkbox */
            if(currentBoxValue != '')
            {
                currentCheck.checked = true;
            }
            else
            {
                /*  But if they cleared out the textbox, uncheck the checkbox */
                currentCheck.checked = false;
            }

            /*  Recalculate the optimal number line length */
            getNumberLineLengthSuggestion();

            /*  The ratio between start angle and end angle for each prime number needs to be the same, 
                so if the user has changed the ratio for one prime number, we need to update all the
                other start and end angles to match the new ratio */
            updateStartEndBoxes(document.getElementById(event.target.id), "end");
        });
    }

    /*  Having just handled all the end boxes, now we need to handle their corresponding start boxes */
    angleStartBoxes = document.getElementsByClassName("primeStartBox");

    /*  Add listeners to each */
    for(var i = 0; i < angleStartBoxes.length; i++)
    {
        var currentBox = angleStartBoxes[i];

        /*  Filter user inputs so they can only enter decimals and fractions */
        currentBox.addEventListener('beforeinput', event => 
        {            
            if(isAngleOkay(event))
            {
                event.preventDefault();
            }
        });

        /*  If the user gets something past the filter, we need to handle that input */
        currentBox.addEventListener('change', event =>
        {            
            /*  Get the textbox the user is working with, and its corresponding checkbox */
            var currentBoxValue = document.getElementById(event.target.id).value;
            var currentCheck = document.getElementById(event.target.id).parentElement.children[1];

            /*  If they entered something into the textbox, they must want to use the corresponding prime number */
            if(currentBoxValue != '')
            {
                currentCheck.checked = true;
            }
            else
            {
                /* But if they cleared out the textbox, they must not want to use this prime number */
                currentCheck.checked = false;
            }

            /*  The ratio between start angle and end angle for each prime number needs to be the same, 
                so if the user has changed the ratio for one prime number, we need to update all the
                other start and end angles to match the new ratio */
            updateStartEndBoxes(document.getElementById(event.target.id), "start");
        });
    }

    /*  Get the button to start the animation in Prime Numbers Mode */
    var buttonProcess = document.getElementById("buttonProcess");

    if(buttonProcess != null)
    {
        buttonProcess.addEventListener('click', () =>
        {
            prepareNumberLine();
            play();
        });
    }
}

/**
 * Checks whether the user input would work as an angle.
 * @param {Event} event 
 * @returns {boolean} true if input was a number, a period, or a forward slash; false otherwise
 */
function isAngleOkay(event)
{
    return event.data != null && !regexForAngles.test(event.data)
}

/**
 * Checks whether the user input would work as an instruction string. 
 * @param {Event} event 
 * @returns {boolean} true if input was a letter; false otherwise
 */
function isStringOkay(event)
{
    return regexForReplacementStrings.test(event.data);
}

/**
 * Check whether we should show the user the inputs for Lindemayer mode or Prime Numbers mode
 */
function checkMode()
{
    switch(modeSelect.value)
    {
        case "lindenmayer":
            document.getElementById("lindenmayer").style.display = '';
            document.getElementById("primes").style.display = 'none';
            break;
        case "prime":
            document.getElementById("lindenmayer").style.display = 'none';
            document.getElementById("primes").style.display = '';
            break;
    }
}

/**
 * Check whether the user wants to see a slide show of each iteration of the instruction
 * string (animationStyle == 0), or a full animation of the final iteration (animationStyle == 1)
 * in Lindenmayer mode
 */
function checkLindenmayerAnimationStyle()
{
    switch(lindenmayerAnimationSelect.value)
    {
        case "lindenmayerIterate":
            animationStyle = 0;
            break;
        case "lindenmayerAnimate":
            animationStyle = 1;
            break;
    }
}

/**
 * Check whether the user wants to see the number line animated up to a particular (set of) angles
 * (animationStyle == 2), or an indefinte animation where the power sequence from different primes
 * leads to different turning rates (animationStyle == 3) in Prime Numbers mode
 */
function checkPrimeAnimationStyle()
{
    /*  In animationStyle 2, users need to be given a textbox to specify the start angle
        and a textbox to specify the end angle, for each prime number. The end angle textbox is also
        used in animationStyle 3, but its label needs to be changed (and the start angle textbox
        and its label need to be hidden in animationStyle 3). So, this switch statement has the
        job of making sure the appropriate textboxes and labels are shown/hidden, and that
        the labels that are shown contain the correct text */
    switch(primeAnimationSelect.value)
    {
        case "primeAngle":
            animationStyle = 2;
            
            for(var i = 0; i < angleStartBoxes.length; i++)
            {
                angleStartBoxes[i].style.display = ''; // Show the current start angle textbox 

                var label = getLabelForElementID(angleStartBoxes[i]);
                
                if(label != null)
                {
                    label.style.display = ''; // Show its label
                }

                label = getLabelForElementID(angleEndBoxes[i]);

                if(label != null)
                {
                    label.innerHTML = "To:"; // Switch its corresponding end angle textbox's label
                }
            }

            break;

        case "primeSpeed":
            animationStyle = 3;

            for(var i = 0; i < angleStartBoxes.length; i++)
            {
                angleStartBoxes[i].style.display = 'none'; // Hide the current start angle textbox

                var label = getLabelForElementID(angleStartBoxes[i]);
                
                if(label != null)
                {
                    label.style.display = 'none'; // Hide its label
                }
                
                label = getLabelForElementID(angleEndBoxes[i]);
                
                if(label != null)
                {
                    label.innerHTML = "Relative Speed:"; // Change the corresponding end angle textbox's label
                }
            }

            break;
    }
}

/**
*   Called when the user holds down a button or key to speed the animation up or slow it down
*/
function changeAnimationSpeed()
{
    switch(userInputDirection)
    {
        case "faster":
            proportionIncrement *= 1.1;
            break;
        case "slower":
            proportionIncrement /= 1.1;

            if(proportionIncrement == 0)
            {
                proportionIncrement = 0.0000001;
            }
            break;
    }
}

/**
*   Called when the user clicks a button or presses a key combination requesting that we jump
*   to the beginning or end of the animation
*/
function jumpTo(destination)
{
    if(animationStyle == 1 || animationStyle == 2)
    {
        switch(destination)
        {
            case "end":
                currentProportion = 1;

                if(!animatingLine && !paused)
                {
                    incrementDirection = 1;
                }
                else
                {
                    incrementDirection = -1;
                }
                break;
            case "start":
                currentProportion = 0;
                if(!animatingLine && !paused)
                {
                    incrementDirection = -1;
                }
                else
                {
                    incrementDirection = 1;
                }
                break;
        }

        if(!animatingLine && !paused)
        {
            //console.log("Calling play");
            play();
        }
        else
        {
            animatingLine = false;
            paused = false;
            drawFigure(true, true);
            percentDIV.innerHTML = (currentProportion * 100).toLocaleString(undefined, {minimumIntegerDigits: 3}) + "%";
        }
    }
    else if(animationStyle == 0)
    {
        switch(destination)
        {
            case "end":
                for(var i = currentIteration; i < numIterations; i++)
                {
                    updateIterationInformation(i);
                }
                currentIteration = numIterations;
                currentProportion = 1;
                break;
            case "start":
                currentIteration = 0;
                getSeedRules();
                animatingLine = true;
                break;
        }
    }
}

/**
*   Called when the user clicks a button or presses a key requesting that the camera immediately
*   center the figure/line/fractal on canvas and zoom till the figure exactly fits the canvas
*/
function fitFractalToScreen()
{
    drawFigure(true, true);
    camera.rotation = 0;
    percentDIV.innerHTML = (currentProportion * 100).toLocaleString(undefined, {minimumIntegerDigits: 3}) + "%";
}

/**
*   Called when the user clicks a button or presses a key combination requesting that the line be drawn in
*   different colors and/or on a different color background
*/
function changeColorMode(newMode)
{
    clearLine(false);
    switch(newMode)
    {
        case "!":
            colorMode = 0;
            currentColor = colorWhite;
            break;
        case "@":
            colorMode = 1;
            currentColor = colorWhite;
            break;
        case "#":
            colorMode = 2;
            currentColor = colorBlack;
            break;
    }

    setLineForFractal();
    strokePoints();

    if(document.activeElement.id == "seed" || document.activeElement.className == "ruleTextbox")
    {
        drawTextboxString(document.activeElement.value);
    }
}

/**
*   When the color mode changes, or when we need to change the line's thickiness, we need to reset 
*   the lines we use to draw to the screen.
*/
function setLineForFractal(width)
{
    if(width == null)
    {
        width = fractalLineThickness / zoom;
    }

    if(lineForFractalPart != null)
    {
        lineForFractalPart.clear();
    }

    if(lineForFractal == null)
    {
        lineForFractal = [];
    }

    if(colorMode == 0)
    {
        var numColors = lineForFractalPoints.length < 101 ? lineForFractalPoints.length - 1 : 100;

        if(numColors < 1){ numColors = 1;}
    }
    else
    {
        numColors = 1;
    }

    if(lineForFractal.length < numColors)
    {
        for(var i = lineForFractal.length; i < numColors; i++)
        {
            lineForFractal.push(currentScene.add.graphics());
        }
    }
    else if(lineForFractal.length > numColors)
    {
        for(var i = numColors; i < lineForFractal.length; i++)
        {
            lineForFractal[i].clear();
            lineForFractal[i].destroy();
            lineForFractal.pop();
            i--;
        }
    }

    var color;

    for(var i = 0; i < lineForFractal.length; i++)
    {
        lineForFractal[i].clear();
        if(colorMode == 0)
        {
            color = Phaser.Display.Color.HSVToRGB((i + 1) / lineForFractal.length, 1, 1).color;
            camera.setBackgroundColor(0x000000);
        }
        else if(colorMode == 1)
        {
            color = Phaser.Display.Color.GetColor(255, 255, 255);
            camera.setBackgroundColor(0x000000);
        }
        else if(colorMode == 2)
        {
            color = Phaser.Display.Color.GetColor(0, 0, 0);
            camera.setBackgroundColor(0xffffff);
        }

        lineForFractal[i].lineStyle(width, color);
    }
}

/**
*   Called when the user clicks a button or presses a key to request that the line used to draw
*   the fractal be made thicker or thinner
*/
function changeLineThickness()
{
    var thickness = 1;

    switch(userInputDirection)
    {
        case "up":
            fractalLineThickness *= 1.1;
            break;
        case "down":
            fractalLineThickness /= 1.1;
            break;
    }

    thickness = fractalLineThickness / zoom;
    setLineForFractal(thickness);
    strokePoints();
}

/**
*   Called when the user clicks a button or presses a key combination to request that camera zoom in or out
*/
function zoomCamera()
{
    switch(userInputDirection)
    {
        case "in":
            zoom *= 1.1;
            break;
        case "out":
            zoom /= 1.1;
            break;
    }

    camera.setZoom(zoom);
    setLineForFractal(fractalLineThickness / zoom);
    strokePoints();
}

/**
*   Called when the user clicks a button or presses a key to request that camera move up/down or left/right
*/
function moveCamera()
{
    cameraTarget.rotation = -camera.rotation;

    var moveAmount = 2 / zoom;

    switch(userInputDirection)
    {
        case "up":
            cameraTarget.rotation -= (Math.PI / 2);
            break;
        case "down":
            cameraTarget.rotation += (Math.PI / 2);
            break;
        case "left":
            cameraTarget.rotation -= Math.PI;
            break;
        case "right":
            cameraTarget.rotation += 0;
            break;
    }

    cameraTarget.setPosition(cameraTarget.x + Math.cos(cameraTarget.rotation) * moveAmount, cameraTarget.y + Math.sin(cameraTarget.rotation) * moveAmount);
}

/**
*   Called when the user clicks a button or presses a key combination to request that camera rotate
*/
function rotateCamera()
{
    switch(userInputDirection)
    {
        case "left":
            camera.rotation -= 0.01;
            break;
        case "right":
            camera.rotation += 0.01;
            break;
    }
}

/**
*   Iterates the instruction string in Lindenmayer mode and updates the page to provide information about whatever
*   changes result 
*/
function updateIterationInformation(i)
{
    var startLength = instructionString.length;
    iterateString();

    if(i == 0)
    {
        scaleDIV.innerHTML += i + ":&nbsp;" + roundToClosest(instructionString.length / startLength,.0001);
    }
    else
    {
        scaleDIV.innerHTML += " | " + i + ":&nbsp;" + roundToClosest(instructionString.length / startLength,.0001);
        if(i < 10)
        {
            instructionStringContainerText.innerHTML += "<p>&nbsp;Iteration&nbsp;" + i + ":&nbsp;" + instructionString  + " </p>";
        }
        else
        {
            instructionStringContainerText.innerHTML += "<p>Iteration&nbsp;" + i + ":&nbsp;" + instructionString  + " </p>";
        }        
    }

    stringLengthDIV.parentElement.children[0].innerHTML = "Final Instruction String Length: ";
    stringLengthDIV.innerHTML = instructionString.length + " characters";
}

/**
*   Find out how many iterations the user wants to put the Lindenmayer system through
*/
function getNumIterations()
{
    iterationsBox = document.getElementById("iterations");

    if(iterationsBox != null)
    {
        numIterations = Number(iterationsBox.value);

        if(!isNaN(numIterations) && numIterations != 0)
        {
            numIterations = Math.round(numIterations);
        }
        else
        {
            numIterations = 2;
            iterationsBox.value = 2;
        }
    }

    return numIterations;
}

/**
*   A function for rounding numbers to the closest 2, 5, 10, 10th, 100th, etc.
*   I believe this code is from a user on StackOverflow
*/
function roundToClosest(angle, portion)
{
    var inv = 1.0 / portion;
    var result = Math.round(angle * inv) / inv;

    return result;
}

/**
*   Whenever we need to add rules for a particular symbol, this function will do the trick
*/
function addRulesFor(entry)
{
    addReplacementRule(entry);
    addInterpretationRule(entry);
}

/**
*   Called by addRulesFor()
*/
function addReplacementRule(entry)
{
    var array = entry[1].split("_");
    var newArray0 = [entry[0],array[0]];
    
    if(isNewReplacementRuleSymbol(entry[0]))
    {   
        replacementRulesArray.push(newArray0);
    }
    else
    {
        return;
    }

    addHTMLReplacementRuleFor(entry[0],array[0]);
}

/**
*   Called by addRulesFor()
*/
function addInterpretationRule(entry)
{
    var array = entry[1].split("_");

    var newArray1; 
    
    switch(array[1])
    {
        case "0":
            array[1] = "nothing";
            break;
        case "1":
            array[1] = "forward";
            break;
        case "2":
            array[1] = "back";
            break;
        case "3":
            array[1] = "right";
            break;
        case "4":
            array[1] = "left";
            break;
    }
    
    newArray1 = [entry[0],array[1],array[2]];

    if(isNewInterpretationRuleSymbol(entry[0]))
    {
        interpretationRulesArray.push(newArray1);
    }
    else
    {
        return;
    }

    addHTMLInterpretationRuleFor(entry[0],array[1],array[2],radians);
}

/**
*   Check if we already have a replacement rule for a given letter
*/
function isNewReplacementRuleSymbol(newSymbol)
{
    var result = true;

    for(var i = 0; i < replacementRulesArray.length; i++)
    {
        if(replacementRulesArray[i][0] == newSymbol)
        {
            result = false;
            break;
        }
    }

    return result;
}

/**
*   Check if we already have an interpretation rule for a given letter
*/
function isNewInterpretationRuleSymbol(newSymbol)
{
    var result = true;

    for(var i = 0; i < interpretationRulesArray.length; i++)
    {
        if(interpretationRulesArray[i][0] == newSymbol)
        {
            result = false;
            break;
        }
    }

    return result;
}

/**
*   While angles are stored internally as degrees, allow user to switch between
*   treating angles as degrees or radians
*/
function toggleDegreesRadians()
{
    radians = !radians;

    var children = document.getElementById("interpretationRules").children;

    if(radians)
    {       
        //Converting degrees to radians
        for(var i = 0; i < interpretationRulesArray.length; i++)
        {
            var angleRadians = convertDegreesToRadians(interpretationRulesArray[i][2]);
            
            for(var j = 0; j < children.length; j++)
            {
                if(children[j].children[0].innerHTML == interpretationRulesArray[i][0])
                {
                    children[j].children[3].children[0].value = angleRadians;
                    children[j].children[3].children[1].innerHTML = "&pi; radians";
                    break;
                }
            }
        }
    }
    else
    {
        //Converting radians to degrees

        for(var i = 0; i < interpretationRulesArray.length; i++)
        {
            var children = document.getElementById("interpretationRules").children;
            for(var j = 0; j < children.length; j++)
            {
                if(children[j].children[0].innerHTML == interpretationRulesArray[i][0])
                {
                    children[j].children[3].children[0].value = interpretationRulesArray[i][2];
                    children[j].children[3].children[1].innerHTML = " degrees";
                    break;
                }
            }
        }
    }
}

/**
*   When the user switches from using degrees to radians (or vice versa), we need 
*   to update what the page says
*/
function convertDegreesToRadians(numDegrees)
{
    var result = numDegrees * Math.PI / 180;

    result = result % (2 * Math.PI);

    result /= Math.PI;

    return result;
}

/**
*   Process text that might be either decimal or a fraction
*/
function handlePossibleFraction(textbox)
{
    /* Users can enter fractions into the degrees/radians textbox, so get the numerator and denominator */
    var newAngleArray = textbox.value.split("/");

    var newAngle;

    /* If there was a "/" in the text of the textbox, the previous line will have split the text in two */
    if(newAngleArray.length > 1)
    {
        var numerator;

        if(newAngleArray[0] != "")
        {
            numerator = Number(newAngleArray[0]);
        }

        var denominator; 
        
        if(newAngleArray[1] != "")
        {
            denominator = Number(newAngleArray[1]);
        }

        if(numerator != null && !isNaN(numerator) && denominator != null && !isNaN(denominator))
        {
            newAngle = numerator/denominator;
        }
        else if(numerator != null && !isNaN(numerator))
        {
            newAngle = numerator;
        }
        else
        {
            newAngle = 0;
        }
    }
    else // If there was no "/" in the textbox, then we aren't dealing with a fraction
    {
        if(newAngleArray.length > 0)
        {
            newAngle = Number(newAngleArray[0]);

            if(isNaN(newAngle))
            {
                newAngle = 0;
            }
        }
        else
        {
            newAngle = 0;
        }
    }

    return newAngle;
}

/**
*   Make sure we have all the parameters of our Lindenmayer system in order before we begin
*   an animation, or process user input that might affect what rules are in place
*/
function getSeedRules()
{
    /* Read the the instructionString textbox */
    instructionStringTextbox = document.getElementById("seed");

    if(instructionStringTextbox != null)
    {
        instructionString = instructionStringTextbox.value; 
    }

    getReplacementRules();
    getInterpretationRules();

    var forwardBackwardRulePresent = false;
    var angleRulePresent = false;

    for(var i = 0; i < interpretationRulesArray.length; i++)
    {
        if(interpretationRulesArray[i][1] == "right" || interpretationRulesArray[i][1] == "left")
        {
            angleRulePresent = true;
        }
        else if(interpretationRulesArray[i][1] == "forward" || interpretationRulesArray[i][1] == "back")
        {
            forwardBackwardRulePresent = true;
        }
    }

    showDIVs("animate", forwardBackwardRulePresent);
    showDIVs("angle", angleRulePresent);

    if(interpretationRulesArray.length > 0)
    {
        showDIVs("rules", true);
    }
    else
    {
        showDIVs("rules", false);
    }

}

/**
*   Ensure that the HTML and JavaScript representations of the rules for the Lindenmayer system
*   are in sync with each other
*/
function checkRules()
{
    /* Get the instructionString and all the currently-existing rules */
    getSeedRules();

    /* Get all the unique symbols currently used in the instructionString or rules */
    var symbols = updateSymbolsList();

    if(symbols.length != "")
    {
        showDIVs("rules", true);
    }
    else
    {
        showDIVs("all", false);
    }

    /* Check to see if every symbol in the list has a corresponding
       rule */
    for(var i = 0; i < symbols.length; i++)
    {
        var needNewRule = true; // Do we need to make a new rule?

        /* Compare the current symbol to the symbol for each replacement 
           rule */
        for(var j = 0; j < replacementRulesArray.length; j++)
        {
            /* If it turns out that the current symbol aready has a
               corresponding replacement rule, we can move on */
            if(replacementRulesArray[j][0] == symbols[i])
            {
                needNewRule = false;
                break;
            }
        }

        if(needNewRule) // If it turns out that we need to make a new rule
        {
            /* Instantiate a new HTML representation of the new replacement 
               rule. The code for the HTML is stored as a string, and has to 
               be "parsed" as HTML. When you parse a string as HTML, however
               your "DOMParser" creates an entire webpage, with a head and body.
               We just want the HTML element inside the body it creates. */
            const parser = new DOMParser();
            var newRule = parser.parseFromString(replacementRuleHTML,'text/html').body.children[0];

            /* Set the HTML element to display the correct symbol, and initialize
               its textbox to contain the same symbol */
            newRule.children[0].innerHTML = symbols[i];
            newRule.children[2].value = symbols[i];
            newRule.children[2].id = "textbox" + idCounter;
            idCounter++;

            newRule.children[2].addEventListener('beforeinput', event => 
            {
                if(isStringOkay(event))
                {
                    event.preventDefault();
                }
            });
            
            /* Listen for if/when the user changes the text in the textbox. If the
               text gets changed, check to see if we need to add/delete any rules. */
            newRule.children[2].addEventListener('input', event =>
            {
                updateReplacementRule(event.target.id);
                checkRules();
                drawTextboxString(event.target.value);
            });

            newRule.children[2].addEventListener('focus', event =>
            {
                drawTextboxString(event.target.value);
            });

            /* Add the HTML element to the page */
            document.getElementById("replacementRules").appendChild(newRule);

            /* Instantiate a new HTML representation of the new interpretation 
               rule. The code for the HTML is stored as a string, and has to 
               be "parsed" as HTML. When you parse a string as HTML, however
               your "DOMParser" creates an entire webpage, with a head and body.
               We just want the HTML element inside the body it creates. */
            newRule = parser.parseFromString(interpretationRuleHTML,'text/html').body.children[0];
   
               /* Set the HTML element to display the correct symbol, and initialize
                  its textbox to contain the same symbol */
            newRule.children[0].innerHTML = symbols[i];
   
            newRule.children[2].addEventListener('beforeinput', event => 
            {
                if(isStringOkay(event))
                {
                    event.preventDefault();
                }
            });

            /* Listen for if/when the user changes the menu selection. If the
               selection is changed, check to see if we need to add/delete any rules. */
            newRule.children[2].addEventListener('change', event =>
            {
                updateInterpretationRule(event.target.id);
            });

            newRule.children[2].id = "selectMenu" + idCounter;
            idCounter++;

            newRule.children[3].children[0].addEventListener('beforeinput', event => 
            {
                if(isAngleOkay(event))
                {
                    event.preventDefault();
                }
            });

            newRule.children[3].children[0].addEventListener('input', event =>
            {
                updateInterpretationRule(event.target.id);
            });
   
            newRule.children[3].children[0].id = "textbox" + idCounter;
            idCounter++;

            newRule.children[3].style.visibility = "hidden";

            if(radians)
            {
                newRule.children[3].children[1].innerHTML = "&pi; radians";
            }
            else
            {
                newRule.children[3].children[1].innerHTML = " degrees";
            }

            /* Add the HTML element to the page */
            document.getElementById("interpretationRules").appendChild(newRule);
        }
    }

    /* Next, we need to check if there are any rules still hanging around for
       symbols that the user is no longer using/has deleted. First, check to see
       if we need to add any Javascript representations of replacement rules,
       since we might have just created some new HTML representations of such rules. */
    getSeedRules();

    /* Next, go through each of the replacement rules and check whether its symbol
       is included in our symbols list. */
    for(var i = 0; i < replacementRulesArray.length; i++)
    {
        /* If we found a rule for a symbol that is no longer being used, we need
           to delete it. */
        if(!symbols.includes(replacementRulesArray[i][0]))
        {
            /* First, delete the HTML representation of the rule by getting all 
               the elements in the replacementRules div.*/
            var children = document.getElementById("replacementRules").children;

            /* Then, go through all those elements and find the one for the symbol
               we are no longer using. */
            for(var j = 0; j < children.length; j++)
            {
                if(children[j].children[0] == null || children[j].children[0].innerHTML == replacementRulesArray[i][0])
                {
                    children[j].remove();
                    break;
                }
            }

            /* Finally, delete the Javascript representation of the rule */
            replacementRulesArray.splice(i,1);

            /* Second, delete the HTML representation of the interpretation rule by getting all 
               the elements in the interpretationRules div.*/
               children = document.getElementById("interpretationRules").children;
   
               /* Then, go through all those elements and find the one for the symbol
                  we are no longer using. */
               for(var j = 0; j < children.length; j++)
               {
                   if(children[j].children[0] == null || children[j].children[0].innerHTML == interpretationRulesArray[i][0])
                   {
                       children[j].remove();
                       break;
                   }
               }
   
               /* Finally, delete the Javascript representation of the rule */
               interpretationRulesArray.splice(i,1);

            /* Since we removed an element from the replacement rules array, the next
               element to check will have slid into the spot we just created by
               deleting the current element. But the for() loop is going to 
               increment i by 1, which will mean we skip the next element. So, 
               we need to decrement i by 1 so that we check the new element
               in the current spot. */
            i--;
        }
    }
}

/**
*   We want to avoid showing the user elements that they can't currently use. This function is
*   to allow the app to hide and show different elements depending on the situation
*/
function showDIVs(category, show)
{
    var showHide = 'visible';

    if(!show)
    {
        showHide = 'hidden';
    }

    switch(category)
    {
        case "animate":
            iterationsBox.parentElement.style.visibility = showHide;
            animateDIV.style.visibility = showHide;
            outputDIV.style.visibility = showHide;
            buttonGo.style.visibility = showHide;
            if(show)
            {
                okayToShowControlButtons = true;
            }
            else
            {
                okayToShowControlButtons = false;
            }
            break;
        case "angle":
            radioButtonsDIV.style.visibility = showHide;
            if(show)
            {
                radioButtonsDIV.style.display = '';
            }
            else
            {
                radioButtonsDIV.style.display = 'none';
            }
            break;
        case "rules":
            htmlReplacementRulesDIV.style.visibility = showHide;
            htmlInterpretationRulesDIV.style.visibility = showHide;
            if(show)
            {
                htmlReplacementRulesDIV.style.display = '';
                htmlInterpretationRulesDIV.style.display = '';
            }
            else
            {
                htmlReplacementRulesDIV.style.display = 'none';
                htmlInterpretationRulesDIV.style.display = 'none';
            }
            break;
        case "all":
            htmlReplacementRulesDIV.style.visibility = showHide;
            htmlInterpretationRulesDIV.style.visibility = showHide;
            iterationsBox.parentElement.style.visibility = showHide;
            animateDIV.style.visibility = showHide;
            outputDIV.style.visibility = showHide;
            buttonGo.style.visibility = showHide;
            radioButtonsDIV.style.visibility = showHide;
            if(show)
            {
                okayToShowControlButtons = true;
                htmlReplacementRulesDIV.style.display = '';
                htmlInterpretationRulesDIV.style.display = '';
                radioButtonsDIV.style.display = '';
            }
            else
            {
                okayToShowControlButtons = false;
                htmlReplacementRulesDIV.style.display = 'none';
                htmlInterpretationRulesDIV.style.display = 'none';
                radioButtonsDIV.style.display = 'none';
            }
    }
}

/* When the user has entered text into a replacement rule textbox, or deleted text therefrom
    we need to change the replacement string in the corresponding rule.
    Called by replacement rule textboxes and processDrawing()*/
function updateReplacementRule(targetID)
{
    animatingLine = false; // Stop animating the fractal, if we were.
    currentProportion = 0; // Reset the animation to 0
    
    var htmlOfRule = document.getElementById(targetID).parentElement; // Get HTML representation of the rule whose text just changed

    if(htmlOfRule == null)
    {
        return; // If we couldn't get the textbox, we can't continue
    }

    /* Go through all the replacement rules currently on file to find the one whose replacement string
        we need to update
    */
    for(var i = 0; i < replacementRulesArray.length; i++)
    {
        if(replacementRulesArray[i][0] == htmlOfRule.children[0].innerHTML)
        {
            replacementRulesArray[i][1] = htmlOfRule.children[2].value;
            break;
        }
    }
}

/* Function to change the specifics of an interpretation rule (e.g., whether it says to go forward or turn, and
    if it says to turn, by how much). Called by the <select> menu and and degree/radians textbox in the HTML
    representation of an interpretation rule */
function updateInterpretationRule(targetID)
{
    animatingLine = false; // Stop drawing the fractal, if we were
    currentProportion = 0; // Reset the fractal to the beginning
    
    /* Get the HTML element that registered the change. This will be either a 
       <select> menu or a textbox */
    var htmlOfRule = document.getElementById(targetID);

    var newAngle;

    /* If the changed was made to a textbox containing the degree/radians to turn, 
        it will have "textbox" in its id */
    if(targetID.includes("textbox"))
    {
        newAngle = handlePossibleFraction(htmlOfRule);

        /* Now get the div containing both the <select> menu and the degrees textbox */
        htmlOfRule = htmlOfRule.parentElement.parentElement;
    }
    else // If the change wasn't in a textbox, then we need to get the div containing the <select> element
    {
        htmlOfRule = htmlOfRule.parentElement;
    }

    /* Now figure out which interpretation rule was changed */

    for(var i = 0; i < interpretationRulesArray.length; i++)
    {
        /* Check the symbol of the current rule against the symbol of the HTML interpretation rule */
        if(interpretationRulesArray[i][0] == htmlOfRule.children[0].innerHTML)
        {
            /* If we found the interpretation rule we were looking for, set its instruction to equal the selected value
               in the <select> menu */
            interpretationRulesArray[i][1] = htmlOfRule.children[2].value;

            /* Next, show the degree/radians textbox and text label if the new instruction is to turn */
            if(interpretationRulesArray[i][1] == "right" || interpretationRulesArray[i][1] == "left")
            {
                htmlOfRule.children[3].style.visibility = "visible";
            }
            else // but hide them if the new instruction is something else
            {
                htmlOfRule.children[3].style.visibility = "hidden";
            }

            if(newAngle != null)
            {
                interpretationRulesArray[i][2] = Number(newAngle);
            }
            break;
        }
    }

    getSeedRules();
}

/* function to get all the unique symbols being used by the instructionString and/or
   rules */
function updateSymbolsList()
{
    var symbols = []; // The array to hold the list of symbols

    /* Start with the instructionString. Check every character in it */
    for(var i = 0; i < instructionString.length; i++)
    {
        /* If the symbols list doesn't already contain the 
           current character we are examining in the instructionString */
        if(!symbols.includes(instructionString.charAt(i)))
        {
            symbols.push(instructionString.charAt(i)); // We need this character in the symbol list
        }
    }

    /* Next, check all the replacement strings in the replacement rules */
    for(var i = 0; i < replacementRulesArray.length; i++)
    {
        /* The replacement string in each rule is the second element, so go through
           each character in the current rule's replacement string */
        for(var j = 0; replacementRulesArray[i][1] != null && j < replacementRulesArray[i][1].length; j++)
        {
            /* If we don't already have the current character in our symbols list,
               we need to add it to the list */
            if(!symbols.includes(replacementRulesArray[i][1].charAt(j)))
            {
                symbols.push(replacementRulesArray[i][1].charAt(j));
            }
        }
    }

    return symbols;
}

/**
*   Update the page when a new replacement rule is needed for the Lindenmayer system
*/
function addHTMLReplacementRuleFor(symbol, replacement)
{
    /* Instantiate a new HTML representation of the new replacement 
    rule. The code for the HTML is stored as a string, and has to 
    be "parsed" as HTML. When you parse a string as HTML, however
    your "DOMParser" creates an entire webpage, with a head and body.
    We just want the HTML element inside the body it creates. */
    const parser = new DOMParser();
    var newRule = parser.parseFromString(replacementRuleHTML,'text/html').body.children[0];

    /* Set the HTML element to display the correct symbol, and initialize
        its textbox to contain the same symbol */
    newRule.children[0].innerHTML = symbol;
    newRule.children[2].value = replacement;
    newRule.children[2].id = "textbox" + idCounter;
    idCounter++;

    newRule.children[2].addEventListener('beforeinput', event => 
    {
        if(isStringOkay(event))
        {
            event.preventDefault();
        }
    });

    /* Listen for if/when the user changes the text in the textbox. If the
        text gets changed, check to see if we need to add/delete any rules. */
    newRule.children[2].addEventListener('input', event =>
    {
        updateReplacementRule(event.target.id);
        checkRules();
        drawTextboxString(event.target.value);
    });

    newRule.children[2].addEventListener('focus', event =>
    {
        drawTextboxString(event.target.value);
    });

    /* Add the HTML element to the page */
    document.getElementById("replacementRules").appendChild(newRule);
}

/**
*   Update the page when a new interpretation rule is needed for the Lindenmayer system
*/
function addHTMLInterpretationRuleFor(symbol, action, angle, angleMeasureIsRadians)
{
    const parser = new DOMParser();
    /* Instantiate a new HTML representation of the new interpretation 
        rule. The code for the HTML is stored as a string, and has to 
        be "parsed" as HTML. When you parse a string as HTML, however
        your "DOMParser" creates an entire webpage, with a head and body.
        We just want the HTML element inside the body it creates. */
    newRule = parser.parseFromString(interpretationRuleHTML,'text/html').body.children[0];

    /* Set the HTML element to display the correct symbol, and initialize
        its textbox to contain the same symbol */
    newRule.children[0].innerHTML = symbol;

    /* Listen for if/when the user changes the menu selection. If the
        selection is changed, check to see if we need to add/delete any rules. */
    newRule.children[2].addEventListener('change', event =>
    {
        updateInterpretationRule(event.target.id);
    });

    newRule.children[2].id = "selectMenu" + idCounter;
    idCounter++;

    newRule.children[3].children[0].addEventListener('beforeinput', event => 
    {
        if(isAngleOkay(event))
        {
            event.preventDefault();
        }
    });

    newRule.children[3].children[0].addEventListener('input', event =>
    {
        updateInterpretationRule(event.target.id);
    });

    newRule.children[3].children[0].id = "textbox" + idCounter;
    idCounter++;

    switch(action)
    {
        case "nothing":
            newRule.children[2].selectedIndex = 0;
            newRule.children[3].style.visibility = "hidden";
            break;
        case "forward":
            newRule.children[2].selectedIndex = 1;
            newRule.children[3].style.visibility = "hidden";
            break;
        case "back":
            newRule.children[2].selectedIndex = 2;
            newRule.children[3].style.visibility = "hidden";
            break;
        case "right":
            newRule.children[2].selectedIndex = 3;
            break;
        case "left":
            newRule.children[2].selectedIndex = 4;
            break;
    }

    if(angleMeasureIsRadians)
    {
        newRule.children[3].children[1].innerHTML = "&pi; radians";
        newRule.children[3].children[0].value = convertDegreesToRadians(angle);
    }
    else
    {
        newRule.children[3].children[1].innerHTML = " degrees";
        newRule.children[3].children[0].value = angle;
    }

    /* Add the HTML element to the page */
    document.getElementById("interpretationRules").appendChild(newRule);
}

/**
*   Make sure the JavaScript representation of the replacement rules is in sync with what
*   the user is seeing on the page
*/ 
function getReplacementRules()
{
    /* Get the section of the page for replacement rules */
    if(htmlReplacementRulesDIV == null)
    {
        htmlReplacementRulesDIV = document.getElementById("replacementRules");
    }

    var htmlReplacementRules; // An array of the individual replacement rules

    /* If we actually found the replacement rules section of the HTML . . . */
    if(htmlReplacementRulesDIV != null)
    {
        /* . . . get the individual HTML replacement rules inside it, if there are any */
        htmlReplacementRules = htmlReplacementRulesDIV.children;
    }

    /* Run through the replacement rules in the HTML and convert them to JavaScript rules */
    for(var i = 0; i < htmlReplacementRules.length; i++)
    {
        /* Each replacement rule has two parts: the symbol to replace, and the string
           of symbols with which that symbol is meant to be replaced */ 
        var symbol = "";
        var replacementString = "";

        /* Inside each HTML replacement rule there are several segments. We need to find
           the one tagged as the symbol, and the one tagged as the textbox */
        for(var j = 0; j < htmlReplacementRules[i].children.length; j++)
        {
            if(htmlReplacementRules[i].children[j].className == "symbol")
            {
                /* We've found the symbol segment. The symbol itself is the "innerHTML" of the segment. */
                symbol = htmlReplacementRules[i].children[j].innerHTML;
            }
            else if(htmlReplacementRules[i].children[j].className == "ruleTextbox")
            {
                /* We've found the textbox containing the string to replace the symbol.
                   The string of symbols is the textbox's "value" */
                replacementString = htmlReplacementRules[i].children[j].value;
            }
        }

        /* Next, we need to check whether we already have a Javascript version of the rule.
           if we don't, we need to make one */
        var newRule = true;

        for(var j = 0; j < replacementRulesArray.length; j++)
        {
            if(replacementRulesArray[j] != null && symbol == replacementRulesArray[j][0])
            {
                newRule = false;
                break;
            }
        }

        if(newRule)
        {
            replacementRulesArray.push([symbol, replacementString]);
        }
    }
}

/**
*   Make sure the JavaScript representation of the interpretation rules is in sync with what
*   the user is seeing on the page
*/ 
function getInterpretationRules()
{
    /* Get the section of the page for Interpretation rules */
    if(htmlInterpretationRulesDIV == null)
    {
        htmlInterpretationRulesDIV = document.getElementById("interpretationRules");
    }

    var htmlInterpretationRules = []; // An array of the individual Interpretation rules

    /* If we actually found the Interpretation rules section of the HTML . . . */
    if(htmlInterpretationRulesDIV != null)
    {
        /* . . . get the individual HTML Interpretation rules inside it, if there are any */
        htmlInterpretationRules = htmlInterpretationRulesDIV.children;
    }

    currentAnglesHTML = {};

    /* Run through the Interpretation rules in the HTML and convert them to JavaScript rules */
    for(var i = 0; i < htmlInterpretationRules.length; i++)
    {
        /* Each Interpretation rule has three parts: the symbol to interpret, the menu from which
           users can select interpretations of the symbol, and the textbox specifying the angle
           to turn if the interpretation is to turn. */ 
        var symbol = "";
        var interpretationString = "";
        var angle;

        /* Inside each HTML Interpretation rule there are several segments. We need to find
           the one tagged as the symbol, the one tagged as the interpretationSelect, and
           the one tagged as the angle (or, rather, the angleTextbox inside the angle div) */
        for(var j = 0; j < htmlInterpretationRules[i].children.length; j++)
        {
            if(htmlInterpretationRules[i].children[j].className == "symbol")
            {
                /* We've found the symbol segment. The symbol itself is the "innerHTML" of the segment. */
                symbol = htmlInterpretationRules[i].children[j].innerHTML;
            }
            else if(htmlInterpretationRules[i].children[j].className == "interpretationSelect")
            {
                /* We've found the select menu containing the instruction about what to do in response to the the symbol.
                   The instruction is the textbox's "value" */
                interpretationString = htmlInterpretationRules[i].children[j].value;
            }

            if(interpretationString == "right" || interpretationString == "left")
            {
                if(htmlInterpretationRules[i].children[j].className == "angle")
                {
                    angle = htmlInterpretationRules[i].children[j].children[0].value;
                }
            }
        }

        /* Next, we need to check whether we already have a Javascript version of the rule.
           if we don't, we need to make one */
        var newRule = true;
        for(var j = 0; j < interpretationRulesArray.length; j++)
        {
            if(symbol == interpretationRulesArray[j][0])
            {
                newRule = false;
            }
        }

        if(newRule)
        {
            /* Create the Javascript version of the rule */
            interpretationRulesArray.push([symbol, interpretationString, angle]);
        }
    }

    currentAngleDIVs = document.getElementsByClassName("currentAngle");

}

/**
*   Apply the replacement rules to the current state of the instructionString to produce its
*   next state
*/
function iterateString()
{
    var currentLetter = "";
    var result = "";

    var replacementRule;

    for(var i = 0; i < instructionString.length; i++)
    {
        currentLetter = instructionString.charAt(i);
        replacementRule = findReplacementRule(currentLetter);

        if(replacementRule != null && replacementRule[1] != null)
        {
            result += replacementRule[1];
        }
    }

    getAngleSum();

    instructionString = result;
    

    if(angleSum != 0)
    {
        proportionIncrement = 1 / (Math.abs(angleSum) * Math.sqrt(Math.log(instructionString.length)));
        if(isNaN(proportionIncrement) || proportionIncrement < 0.0000001)
        {
            proportionIncrement = 0.00001;
        }
    }
    else
    {
        proportionIncrement = 1 / instructionString.length;
        if(proportionIncrement < 0.01)
        {
            proportionIncrement = 0.01;
        }
    }
}

/**
*   Called by iterateString(). Returns information about what string of letters should replace symbol 
*/
function findReplacementRule(symbol)
{
    for(var i = 0; i < replacementRulesArray.length; i++)
    {
        if(replacementRulesArray[i][0] == symbol)
        {
            return replacementRulesArray[i];
        }
    }

    return null;
}

/**
*   Creates a dictionary representation of the replacement and interpretation rules so that they can be
*   quickly accessed via their symbols
*/
function convertRulesToJSON()
{
    for(var i = 0; i < replacementRulesArray.length; i++)
    {
        replacementRulesJSON[replacementRulesArray[i][0]] = replacementRulesArray[i][1];
    }

    for(var i = 0; i < interpretationRulesArray.length; i++)
    {
        interpretationRulesJSON[interpretationRulesArray[i][0]] = [interpretationRulesArray[i][1], interpretationRulesArray[i][2]];
    }
}

/**
*   Calculates how much the line will turn over its entire length.
*/
function getAngleSum()
{
    angleSum = 0;
    var instructionStringLength = instructionString.length;
    for(var i = 0; i < instructionStringLength; i++)
    {
        currentLetter = instructionString.charAt(i);
        currentRule = interpretationRulesJSON[currentLetter];

        if(currentRule != null)
        {
            switch(currentRule[0])
            {
                case 'right':
                    if(!isNaN(Number(currentRule[1])))
                    {
                        angleSum += Number(currentRule[1]);
                    }
                    break;
                case 'left':
                    if(!isNaN(Number(currentRule[1])))
                    {
                        angleSum -= Number(currentRule[1]);
                    }
                    break;
            }
        }
    }

    if(radians)
    {
        document.getElementById("angleSum").children[0].innerHTML = "Final Sum of Rotations: ";
        document.getElementById("angleSum").children[1].innerHTML = convertDegreesToRadians(angleSum) + "&pi; radians";
    }
    else
    {
        document.getElementById("angleSum").children[0].innerHTML = "Final Sum of Rotations: ";
        document.getElementById("angleSum").children[1].innerHTML = angleSum + " degrees";
    }
}

/**
 * In Prime Numbers mode, animationStyle 2, we need every prime number that the user has selected
 * to have a start and end angle. Furthermore, we need the ratio between start and end
 * angles to be the same for every prime number the user has selected. This function
 * makes sure that this is the case.
 * @param {HTMLInputElement} currentBox 
 * @param {string} startOrEnd - expected: "start" or "end," depending on whether the user was editing the
 * text in a start or end angle textbox
 */
function updateStartEndBoxes(currentBox, startOrEnd)
{
    var startValue = NaN;
    var endValue = NaN;

    switch(startOrEnd)
    {
        /*  If the user was working with a start angle box, get the value they entered, along with the value they have
            entered into the corresponding end angle box */
        case "start":
            startValue = currentBox.value == "" ? NaN : Number(currentBox.value);
            endValue = currentBox.parentElement.children[5].value == "" ? NaN : Number(currentBox.parentElement.children[5].value);
            break;
        /*  However, if they edited the text in an end angle box, get the start angle as well (and if they haven't
            entered a start angle, set it to 0) */
        case "end":
            if(currentBox.parentElement.children[3].value == "")
            {
                startValue = 0;
                currentBox.parentElement.children[3].value = 0;
            }
            else
            {
                startValue = Number(currentBox.parentElement.children[3].value)
            }
            endValue = currentBox.value == "" ? NaN : Number(currentBox.value);
            break;
    }

    var ratio = NaN; // We need to calculate the ratio between the start and end angles

    /*  If the user hasn't entered both a valid start and end angle, we need to fill in values for them
        if they have given us valid start and end angles for any of the other prime numbers */
    if(isNaN(startValue) || isNaN(endValue))
    {
        var ratioFound = false;

        /*  Check all the prime numbers' start and end angles to see if any present a legitimate ratio we can use*/
        for(var i = 0; !ratioFound && i < angleEndBoxes.length; i++)
        {
            var currentEndValue = angleEndBoxes[i].value;
            var currentStartValue = angleEndBoxes[i].parentElement.children[3].value;

            /*  If the current prime number's start and end angles were both legimate, calculate the ration between
                them and then move along */
            if(currentStartValue != "" && !isNaN(Number(currentStartValue)) && currentEndValue != "" && !isNaN(Number(currentEndValue)))
            {
                ratio = Number(currentStartValue) / Number(currentEndValue);
                ratioFound = true;
            }
        }

        /*  If, after checking all the prime numbers, we didn't find any legitimate ratios, quit */
        if(!ratioFound)
        {
            return;
        }   
    }
    else
    {
        /*  If we have a valid start and end angle for the prime number whose angles the user was eidting,
            calculate their ratio */
        ratio = startValue / endValue;
    }

    /*  The ratio between starting angle and ending angle tells us where we need to start our animation */
    currentProportion = ratio;
    /*  If the user has selected a start and end angle that are close together, they must want to 
        examine what happens in that small range of angles closely. So, slow down the animation proportionately */
    proportionIncrement = (1 - ratio) / 10000;

    /*  Don't go too slow, however */
    if(proportionIncrement == 0)
    {
        proportionIncrement = 0.00001;
    }

    /*  Now, fill in all the start and end angles with the appropriate values so they all have the same ratio */
    for(var i = 0; i < angleEndBoxes.length; i++)
    {
        if(angleEndBoxes[i].value != "" && !isNaN(Number(angleEndBoxes[i].value)))
        {
            angleEndBoxes[i].parentElement.children[3].value = angleEndBoxes[i].value * ratio;
        }
        else if(angleEndBoxes[i].parentElement.children[3].value != "" && !isNaN(Number(angleEndBoxes[i].parentElement.children[3].value)))
        {
            angleEndBoxes[i].value = Number(angleEndBoxes[i].parentElement.children[3].value) / ratio; 
        }
    }
}

/**
 * This function takes a given number and generates an array of the highest powers of that number that divide
 * the positive integers, up to some power of that number.
 * @param {number} num - Expected: positive integer
 * @param {number} power - Expected: positive integer
 * @returns {array} The highest powers of num that evenly divide the integers from 1 to num^power.
 * @example
 * 
 * var a = 2;
 * var b = 4;
 * var sequence = generateSequenceFor(a, b);
 * console.log(sequence)
 * // Logs: [0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 4]
 * // These are the highest powers of 2 that evenly divide 1, 2, 3, 4, . . ., 16
 */
function generateSequenceFor(num, power)
{
    /*  The algorithm goes as follows:
        1. Create an array containing nothing but a single 0 (This is "the current array.")
        2. Create num-1 duplicates of the current array (so you end up with num copies thereof, including the original).
        3. Append these num arrays to each other (linking them together, end-to-end) to form a single, larger array.
        4. Increase the final element in the new, larger array, by 1. The array in this state is now "the current array."
        5. Repeate from step 2, on (a total of "power" times)
        */
    var sequence = [0];

    for(var i = 0; i < power; i++)
    {
        var newSequence = [];

        for(var j = 0; j < num - 1; j++)
        {
            newSequence = newSequence.concat(sequence);
        }

        sequence = sequence.concat(newSequence);

        sequence[sequence.length - 1]++;
    }

    return sequence;
}

/**
 * Figure out an ideal length for the number line, based on which prime numbers the user has selected.
 * Called when the user changes which prime numbers to use in Prime Numbers mode.
 */
function getNumberLineLengthSuggestion()
{
    /*  Figure out which prime numbers the user wants to work with */
    var primesToUse = [];

    for(var i = 0; i < primeCheckboxes.length; i++)
    {
        if(primeCheckboxes[i].checked)
        {
            /*  The checkboxes' IDs are just the numbers they represent (e.g., 2, 3, 5, 7) */
            primesToUse.push(Number(primeCheckboxes[i].id));
        }
    }

    /* The number line should be at least 1 long */
    numberLineSuggestedLength = 1;

    var max = 200000; // But it should not be more than 200,000 long, or the app will run too slowly
    var counter = 0; // A way to break out of the while() loop in case anythings wrong

    while(numberLineSuggestedLength < max && counter < 20)
    {
        /*  Multiply all the selected prime numbers together, but don't go over the maximum */
        for(var i = 0; i < primesToUse.length && numberLineSuggestedLength < (max / primesToUse[i]); i++)
        {
            numberLineSuggestedLength *= primesToUse[i];
        }

        /*  The later numbers in the array should also be the larger numbers, so even if multiplying by 
            one of those larger numbers would take us over the max, maybe going back and multiplying by
            one of the smaller numbers wouldn't. So, give the process another go-around or two */
        counter++;
    }

    /*  Display the suggested number for the user */
    document.getElementById("numberLineLength").value = numberLineSuggestedLength;
}

/**
 * Get the the instruction arrays set up for animating lines in Prime Numbers mode.
 * Called when the user presses the "GO" button in Prime Numbers mode. (play() is called
 * next, with that same button press)
 */
function prepareNumberLine()
{
    primeInstructions = []; // The version of the instruction string for Prime Numbers mode
    primeMultipliers = []; // Used if animationStyle == 3
    var primesToUse = []; // The prime numbers the user has selected 

    checkPrimeAnimationStyle(); // Are we in animationStyle 2 or 3?

    for(var i = 0; i < primeCheckboxes.length; i++)
    {
        if(primeCheckboxes[i].checked)
        {
            primesToUse.push(Number(primeCheckboxes[i].id));

            /*  In animationStyle 3, we rotate the line at different speeds, rather than rotating them to different
                destination angles. So, we need to know (proportionally) how fast the user wants us to rotate the 
                line for each prime number */
            if(animationStyle == 3)
            {
                primeMultipliers.push(Number(handlePossibleFraction(primeCheckboxes[i].parentElement.children[5])));
            }
            else
            {
                primeMultipliers.push(1); // Not really needed, but just in case
            } 
        }
    }

    /*  Get the number line length the user wants to use */
    numberLineSuggestedLength = Number(document.getElementById("numberLineLength").value);

    /*  If they entered a non-number, or 0, calculate one for them */
    if(isNaN(numberLineSuggestedLength) || numberLineSuggestedLength == 0)
    {
        for(var i = 0; i < primesToUse.length; i++)
        {
            numberLineSuggestedLength *= primesToUse[i];
        }

        /* If for some reason that didn't work, go with a default of 100 */
        if(isNaN(numberLineSuggestedLength) || numberLineSuggestedLength == 0)
        {
            numberLineSuggestedLength = 100;
        }
    }

    /*  Now we need get the sequence of highest powers of each prime that will evenly divide the
        integers from 1 to numberLineSuggestedLength */
    for(var i = 0; i < primesToUse.length; i++)
    {
        /*  Before we request the sequence, we need to know what power of the current prime will
            get us past the end of the number line, just so we make sure that every number 
            between 1 and numberLineSuggestedLength will have an entry for the current prime. There's
            no particular reason to check powers all the way up to numberLineSuggestedLength,
            but we need some limit to the number of powers we check, so . . . */
        for(var j = 0; j < numberLineSuggestedLength; j++)
        {
            /*  If, when we raise the current prime to the current power, we get a number beyond 
                the end of the number line, we can request the power sequence for this prime*/
            if(Math.pow(primesToUse[i], j) > numberLineSuggestedLength)
            {
                power = j;
                break;
            }
        }

        /*  Add the power sequence for this prim to the list of instructions */
        primeInstructions.push(generateSequenceFor(primesToUse[i],j));
    }

    /* If we are animating up to a particular angle for each prime, we need to find out what that angle is */
    if(animationStyle == 2)
    {
        primeAngles = [];
        
        /*  Go through the primes the user has selected and figure out what angle they want the animation to end 
            at for that prime*/
        for(var i = 0; i < angleEndBoxes.length; i++)
        {
            if(primeCheckboxes[i] != null && primeCheckboxes[i].checked)
            {
                primeAngles.push(Number(angleEndBoxes[i].value));
            }
        }
    }
}

/**
 * Finds the label associated with a given HTML element (e.g., the label for a textbox).
 * This code is borrowed from a user on StackOverflow, I believe
 * @param {HTMLElement} element 
 * @returns {HTMLLabelElement}
 */
function getLabelForElementID(element)
{
    var labelsOnPage = document.getElementsByTagName("LABEL");

    for(var i = 0; i < labelsOnPage.length; i++)
    {
        if(labelsOnPage[i].htmlFor == element.id)
        {
            return labelsOnPage[i];
        }
    }

    return null;
}