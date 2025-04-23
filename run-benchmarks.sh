#!/bin/bash

# Check if the required arguments are provided
if [ "$#" -lt 1 ]; then
    echo "Usage: $0 <name|--all> [times]"
    exit 1
fi

# Parse arguments
NAME=$1
TIMES=${2:-1} # Default to 1 if times is not provided

# Function to run the benchmark for a single example
run_benchmark() {
    local example_name=$1
    local log_file="$(realpath "${example_name}.txt")"

    # Start the web server and capture its output to a file
    echo "Starting the web server for $example_name..."
    node dist/index.js > "$log_file" 2>&1 &
    SERVER_PID=$!

    # Wait for the server to start
    sleep 10
    echo "Web server started with PID $SERVER_PID. Logs are being written to $log_file."

    # Run the loaddiagram.js script with the provided arguments
    echo "Running benchmark for $example_name, over $TIMES runs."
    node benchmarking/loaddiagram.js "$example_name" "$TIMES"

    # Kill the web server
    echo "Stopping the web server for $example_name..."
    kill $SERVER_PID
    wait $SERVER_PID 2>/dev/null

    # Run computestats.js with the full path to the log file
    echo "Aggregating statistics for $example_name..."
    node benchmarking/computestats.js "$log_file" -all
}

# If name is --all, run benchmarks for all examples in /dist/paper-examples/
if [ "$NAME" == "--all" ]; then
    EXAMPLES_DIR="dist/paper-examples"
    if [ ! -d "$EXAMPLES_DIR" ]; then
        echo "Error: Directory $EXAMPLES_DIR does not exist."
        exit 1
    fi

    # Iterate over all directories in /dist/paper-examples/
    for example_dir in "$EXAMPLES_DIR"/*; do
        if [ -d "$example_dir" ]; then
            example_name=$(basename "$example_dir")
            run_benchmark "$example_name"
        fi
    done
else
    # Run benchmark for the specified example
    run_benchmark "$NAME"
fi