#!/bin/sh

echo "|-------- Beginning of Running Back-End Script --------|"
echo "Installing NPM Dependencies:"
time npm install
echo "Removing Files Older Than 2 Days in the 'logs' dir:"
find ./logs -type f -mtime +2 -exec rm {} \;
echo "Setting up Logging Solution (for Later Backend Debugging):"
log_dir="./logs"
if [ -d "$log_dir" ]; then
    echo "Directory $log_dir already exists."
else
    mkdir "$log_dir"
    echo "Directory $log_dir created."
fi
cd "$log_dir"
file_name="log_$(date +'%m-%d-%y-%T').txt"
touch $file_name
cd ..
echo "Running JavaScript MongoDB/Express.js/Node.js Backend (with TypeScript):"
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
    echo "Please type [ 'development' or 'd' ], [ 'production' or 'p' ], or [ 'staging' or 's' ]:"
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
    echo "Backend: Development mode selected"
    npm_config_color=always npm run start 2>&1 | tee -a "./logs/$file_name"
elif [ "$modeLowercase" == "staging" ] || [ "$modeLowercase" == "s" ]; then
    echo "Backend: Staging/Testing mode selected"
    npm_config_color=always npm run stage 2>&1 | tee -a "./logs/$file_name"
elif [ "$modeLowercase" == "production" ] || [ "$modeLowercase" == "p" ]; then
    echo "Backend: Production mode selected"
    npm_config_color=always npm run production 2>&1 | tee -a "./logs/$file_name"
fi

echo "|-------- End of Running Back-End Script --------|"
