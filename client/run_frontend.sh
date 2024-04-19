#!/bin/bash

echo "|-------- Beginning of Running Front-End Script --------|"
echo "Installing NPM Dependencies"
time npm install
echo "Running React + Vite Frontend:"
npm run format

echo "Arg 1:"
echo $1

# Function to display usage instructions
display_usage() {
    echo "Usage: '$0' <mode>"
    echo "<mode> should be 'development' (or 'd') or 'production' (or 'p')"
}

# Check if the script was called with an argument
if [ $# -eq 0 ]; then
    # No argument provided, prompt the user for input
    echo "Please type [ 'development' or 'd' ] or [ 'production' or 'p' ]:"
    read mode 
else
    # Use the first argument passed to the script
    mode="$1"
fi

modeLowercase=$(echo "$mode" | tr '[:upper:]' '[:lower:]')
# Error-checking loop while the 1-argument input is not valid
while [ "$modeLowercase" != "development" ] && [ "$modeLowercase" != "d" ] && [ "$modeLowercase" != "production" ] && [ "$modeLowercase" != "p" ] && [ "$modeLowercase" != "staging" ] && [ "$modeLowercase" != "s" ]; do
    echo "Invalid mode selected: '$mode'."
    display_usage
    read mode
    modeLowercase=$(echo "$mode" | tr '[:upper:]' '[:lower:]')
done

# Check if the mode is 'development' or 'production'
if [ "$modeLowercase" == "development" ] || [ "$modeLowercase" == "d" ]; then
    echo "Frontend: Development mode selected"
    npm run dev
elif [ "$modeLowercase" == "production" ] || [ "$modeLowercase" == "p" ] || [ "$modeLowercase" == "staging" ] || [ "$modeLowercase" == "s" ]; then
    echo "Frontend: Production/Staging mode selected"
    echo "Specific Mode: $modeLowercase"
    npm run preview -- --host
fi

echo "|-------- End of Running Front-End Script --------|"
