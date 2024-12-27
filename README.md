### Hexlet tests and linter status:
[![Actions Status](https://github.com/pinyaevv/fullstack-javascript-project-4/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/pinyaevv/fullstack-javascript-project-4/actions)
[![Maintainability](https://api.codeclimate.com/v1/badges/57add9612d5a154924c9/maintainability)](https://codeclimate.com/github/pinyaevv/fullstack-javascript-project-4/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/57add9612d5a154924c9/test_coverage)](https://codeclimate.com/github/pinyaevv/fullstack-javascript-project-4/test_coverage)
[![Node CI](https://github.com/pinyaevv/fullstack-javascript-project-4/actions/workflows/nodejs.yml/badge.svg)](https://github.com/pinyaevv/fullstack-javascript-project-4/actions/workflows/nodejs.yml)

# PageLoader

PageLoader is a command-line utility that downloads web pages from the internet and saves them locally on your computer. Along with the page, it downloads all the associated resources (images, styles, and JavaScript files), allowing you to open the page offline.

The utility works in the same way as browsers save pages (did you know they can do that?).

## Features

- Downloads a webpage and its resources (CSS, JS, images, etc.).
- Saves the page locally, enabling offline viewing.
- Displays download progress for each resource in the terminal.
- Parallel resource downloading for faster performance.

## Installation

To install the PageLoader utility, follow these steps:
 
1) Clone the repository:

git clone git@github.com:pinyaevv/fullstack-javascript-project-4.git
cd fullstack-javascript-project-4

2) To install the required dependencies, run:

npm install

3) Run the application:
You can now use the page-loader utility

page-loader --output <output-directory> <page-url>

4) Tests:

make test

## Example Usage

[![asciicast](https://asciinema.org/a/jrilD5QGOjnAI2fhoLBFPKkXn.svg)](https://asciinema.org/a/jrilD5QGOjnAI2fhoLBFPKkXn)