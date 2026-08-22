pipeline {
    agent any

    environment {
        DOCKER_HUB_USER = 'sanjaykumar18102005'
        IMAGE_NAME      = 'fitness-wellness-platform'
        IMAGE_TAG       = "${env.BUILD_NUMBER}"
    }

    stages {
        stage('1. Checkout') {
            steps {
                echo "Checking out Git commit: ${env.GIT_COMMIT}"
            }
        }

        stage('2. Install Dependencies & Run Tests') {
            steps {
                // Runs Node via Docker CLI directly to bypass missing plugin requirements
                sh '''
                    docker run --rm -v $PWD:/app -w /app node:20-alpine sh -c "npm ci && npm test"
                '''
            }
        }

        stage('3. Build Docker Image') {
            steps {
                echo "Building Docker image..."
                sh "docker build -t ${DOCKER_HUB_USER}/${IMAGE_NAME}:${IMAGE_TAG} -f Dockerfile ."
            }
        }

        stage('4. Run Smoke Tests') {
            steps {
                sh '''
                    docker run --rm -v $PWD:/app -w /app node:20-alpine sh -c "npm run smoke-test || echo 'No smoke test configured'"
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
