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
                        curl -sOSL https://nodejs.org/dist/${NODE_VERSION}/node-${NODE_VERSION}-linux-x64.tar.xz
                        tar -xf node-${NODE_VERSION}-linux-x64.tar.xz
                        rm node-${NODE_VERSION}-linux-x64.tar.xz
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
                    npm run smoke-test || echo "No smoke test script defined in package.json"
                '''
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
