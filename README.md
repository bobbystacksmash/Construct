# Construct

[![Build Status](https://travis-ci.org/bobbystacksmash/Construct.svg?branch=master)](https://travis-ci.org/bobbystacksmash/Construct)
![](https://img.shields.io/badge/version-alpha-%23ff69b4.svg)

## About

Construct is a cross-platform, Windows Script Host (WSH) emulator, written from
the ground up to be a fully compatible environment for running and dynamically
analysing malicious [JScript](https://en.wikipedia.org/wiki/JScript) programs.

This project was designed to simplify the analysis of highly
obfuscated and deliberately hard-to-follow malicious JScript code.
Favouring configuration over code, Construct attempts to help both
technical and non-technical malware analysts quickly and confidently
gather Indicators Of Compromise (IOCs) from malicious JScript
programs.

_Construct is currently in **alpha**.  Please help improve
the project by [reporting issues](https://github.com/bobbystacksmash/Construct/issues).
Patches are most welcome._

## Installing
The manual install instructions are the most stable.  If you're more comfortable
with Docker, please see the *Docker* install instructions, but beware, these are
experimental at this time.

### Manual Install
Construct has been designed to run on any operating system capable of running
the latest version of the Node.js programming language.  To install Construct:

1. Install the Node.js programming language and the Node Package Manager (NPM).
2. Clone or download this repository.
3. `cd` in to the Construct folder and run `npm install` to install all dependencies.
4. Launch Construct by running `node src/cli.js --help` from the Construct folder.

### Docker (experimental)
_NOTE: This is experimental at this time, and only configures the Construct HTTP UI,
and therefore not recommended for those wishing to use the command line interface._

To install Construct using Docker:

0. Make sure you have Docker installed on your system.
1. Clone or download/extract this repository.
2. Using your terminal, `cd` in to the `Construct` dir created in step #1.
3. Run `docker build -t construct/http:alpha .`
4. Run `docker run -p 8080:8080 construct/http:alpha` _See NOTES (below) for more details_
5. This will fetch all construct modules and dependencies, and start the Construct HTTP UI.
6. Browse to `http://localhost:8080` for the Construct HTTP UI.

_NOTES_
In step 4 we map TCP port 8080 in the container to port 8080 on the Docker host.  If you
already have 8080 mapped to another service, please change the lefthand value.  For example,
if you'd prefer to use port 8282, you may want to use something like:

`docker run -p 8282:8080 construct/http:alpha`

#### Stopping the Construct Docker Container
1. Find the list of currently running containers using `docker ps`
2. From the output, find the container named `construct/http:alpha`, and note its `CONTAINER ID`.
3. Run `docker stop CONTAINER_ID` (being sure to replace `CONTAINER_ID` with the /actual/ container ID).

## Usage

### Web Browser

Construct has a basic HTTP interface.
![Construct's HTTP UI showing Deobfuscator plugin](https://raw.githubusercontent.com/wiki/bobbystacksmash/Construct/images/general/deobfuscator-http.png)
The above shows the deobfuscator plugin in action.  Obfuscated JScript code
was sent through Construct, which analysed it, and produced a sequence of events.
The deobfuscator plugin walks this sequence of events and translates them back in
to JScript in a form that is far more readable by an analyst.  All other output plugins
can also be used from the web interface.

### Command Line

To use construct on the command line, run `node src/cli.js`.  For
details, see `--help`:

```
  Usage: node src/cli.js FILE [options]

  Options:

    -c, --coverage             Write a HTML coverage report to './html-report'.
    -D, --debug                Prints debug information to STDOUT.
    -d, --date <datestr>       Sets the sandbox clock within the virtualised environment.
    --list-reporters           Lists all available output reporters.
    -r, --reporter <REPORTER>  Uses the given REPORTER to produce output.
    -h, --help                 output usage information

```

### Node JS API / Module

Once the Construct API has been tested, the project will be available
for install via NPM.  Until then, make sure you require `index.js` in
the root of your Construct project.

```javascript
const Construct = require("./index");

let analyser = new Construct({
    config:   "./construct.cfg",
    reporter: "dumpevents"
});

analyser.analyse("/path/to/jscript/file")
    .then((analysis) => {
        console.log("Scan results:", JSON.stringify(analysis, null, 2));
    })
    .catch((err) => {
        console.log("Error: ", err.message);
    });
```

## How it works

As JScript code runs inside Construct's analysis environment, a wide number of
different events are emitted.  *Output Reporters* capture these events and
display them as feedback to the analyst.  Construct ships with many different
_output reporters_, including:

 * `dumpnet`     - dumps all network traffic,
 * `dumpfs`      - dumps all filesystem activity,
 * `dumpreg`     - dumps all registry reads/writes,
 * `dumpexec`    - dumps all shell execution commands,
 * `dumpevents`  - dumps all events gathered during execution,
 * `dumpuris`    - dumps all URIs passed to `XMLHttpRequest` instances,
 * `deobfuscate` - displays the JScript program with all obfuscation removed.
 * `dumpeval`    - dumps all dynamic code evaluations (`eval` & `new Function()`),

Construct also tracks code-coverage information and is able to produce an
interactive HTML report showing exactly which statements within the JScript
program were executed.

![Coverage Reports](https://raw.githubusercontent.com/wiki/bobbystacksmash/Construct/images/general/coverage-report.png)

Finally, Construct boasts a virtualised filesystem, registry, and network
stack, meaning each time Construct runs it's as if the analysed code is running
for the first time on a clean Windows system.  Analysts can set the emulated
environment's date and time, as well as being assured each call to
`Math.rand()` will produce the same output.  All filesystem, registry, and
network activity can be manipulated by editing the configuration file.  Via the
configuration file it is possible to:

 * Create dynamic responses to any HTTP-verb request, with full control over
   the response headers & body.

 * Create a "fakeroot" whereby all files and folders within the fakeroot are
   loaded in to Construct's virtual file system.

 * Hook any `exec` call to emulate JScript _shelling out_ to the underlying
   Windows CMD shell or similar (useful for mocking `wmic` or `powershell`
   one-liners).

 * ... and much more.


## Usage


TODO: examples and tutorials coming soon.
