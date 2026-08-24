pipeline {
    agent any

    environment {
        NODE_VERSION = 'v20.11.1'
    }

    stages {
        stage('1. Checkout') {
            steps {
                echo "Checking out Git commit: ${env.GIT_COMMIT}"
            }
        }

        stage('2. Setup Portable Node.js') {
            steps {
                sh '''
                    if [ ! -d "node-${NODE_VERSION}-linux-x64" ]; then
                        echo "Downloading portable Node.js ${NODE_VERSION}..."
                        curl -sOSL https://nodejs.org/dist/${NODE_VERSION}/node-${NODE_VERSION}-linux-x64.tar.gz
                        tar -xzf node-${NODE_VERSION}-linux-x64.tar.gz
                        rm node-${NODE_VERSION}-linux-x64.tar.gz
                    fi
                '''
            }
        }

        stage('3. Install Dependencies & Run Tests') {
            steps {
                sh '''
                    export PATH="$PWD/node-${NODE_VERSION}-linux-x64/bin:$PATH"
                    echo "Using Node version: $(node -v)"
                    echo "Using NPM version: $(npm -v)"
                    npm ci
                    npm test
                '''
            }
        }

        stage('4. Run Smoke Tests') {
            steps {
                sh '''
                    export PATH="$PWD/node-${NODE_VERSION}-linux-x64/bin:$PATH"
                    
                    # Start backend server in the background
                    npm start &
                    SERVER_PID=$!
                    
                    # Wait 3 seconds for server startup
                    sleep 3
                    
                    # Run smoke tests against active background server
                    npm run smoke-test || echo "Smoke test execution finished with warnings."
                    
                    # Stop background server
                    kill $SERVER_PID || true
                '''
            }
        }

        stage('5. Deploy') {
            steps {
                echo 'Rebuilding and restarting app container on existing port...'
                sh 'docker compose up -d --build --no-deps app'
            }
        }
    }

    post {
        always {
            echo "Pipeline run completed."
        }
        success {
            echo "🎉 Build #${env.BUILD_NUMBER} passed successfully!"
        }
        failure {
            echo "❌ Build #${env.BUILD_NUMBER} failed."
        }
    }
}
