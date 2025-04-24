#!/bin/bash

# Check if no meaningful arguments are provided
if [ "$#" -eq 0 ] || { [ "$1" == "node" ] && [ "$2" == "dist/index.js" ]; }; then
    echo "Starting the web server..."
    exec node dist/index.js
    exit 0
fi

# Check if the first argument is --benchmark
if [ "$1" == "--benchmark" ]; then
    # Parse benchmark arguments
    NAME=$2
    TIMES=${3:-5} # Default to 5 if times is not provided

    # Ensure NAME is set
    if [ -z "$NAME" ]; then
        echo "Error: You must specify a name or --all when using --benchmark."
        echo "Usage: $0 --benchmark <name|--all> [times]"
        exit 1
    fi

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
    node --input-type=commonjs benchmarking/loaddiagram.js "$example_name" "$TIMES"
    EXIT_CODE=$?

    # Check if loaddiagram.js exited with an error
    if [ $EXIT_CODE -ne 0 ]; then
        echo "Error: loaddiagram.js exited with code $EXIT_CODE."
        echo "Stopping the web server for $example_name..."
        kill $SERVER_PID
        wait $SERVER_PID 2>/dev/null

        # Output the contents of the log file
        echo "Contents of the log file ($log_file):"
        cat "$log_file"

        # Exit with the same error code
        exit $EXIT_CODE
    fi

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
else
    echo "Usage: $0 [--benchmark <name|--all> [times]]"
    exit 1
fi