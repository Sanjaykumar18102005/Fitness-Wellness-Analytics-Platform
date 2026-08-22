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
                // Runs Node.js commands inside a node container to avoid 'npm: not found'
                script {
                    docker.image('node:20-alpine').inside {
                        sh 'npm ci'
                        sh 'npm test'
                    }
                }
            }
        }

        stage('3. Build Docker Image') {
            steps {
                script {
                    echo "Building Docker image..."
                    appImage = docker.build("${DOCKER_HUB_USER}/${IMAGE_NAME}:${IMAGE_TAG}", "-f Dockerfile .")
                }
            }
        }

        stage('4. Run Smoke Tests') {
            steps {
                script {
                    docker.image('node:20-alpine').inside {
                        sh 'npm run smoke-test'
                    }
                }
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
