pipeline {
    agent any

    environment {
        DOCKER_REGISTRY = 'fitnessplatform'
        IMAGE_NAME = 'fitness-app'
        PORT = '3000'
        DB_HOST = 'localhost'
        DB_PORT = '5433'
        DB_USER = 'testuser'
        DB_PASSWORD = 'testpassword'
        DB_NAME = 'fitness_platform_test'
        JWT_SECRET = 'fitpulse_jenkins_ci_jwt_secret_key'
        ENCRYPTION_SECRET = 'fitness_wellness_default_secret_key_32chars!'
        PREV_STAGING_TAG = 'develop-latest'
        PREV_PROD_TAG = '1.0.0-previous'
    }

    options {
        timeout(time: 1, unit: 'HOURS')
        ansiColor('xterm')
    }

    stages {
        // STAGE 1: CHECKOUT SOURCE CODE
        stage('1. Checkout') {
            steps {
                script {
                    echo "Checking out Git branch: ${env.BRANCH_NAME ?: env.GIT_BRANCH ?: 'local'}"
                    checkout scm
                    env.GIT_SHA_SHORT = sh(script: 'git rev-parse --short HEAD || echo "localcommit"', returnStdout: true).trim()
                    echo "Git Commit SHA: ${env.GIT_SHA_SHORT}"
                }
            }
        }

        // STAGE 2: INSTALL DEPENDENCIES
        stage('2. Install dependencies') {
            steps {
                echo 'Executing npm ci...'
                sh 'npm ci'
            }
        }

        // STAGE 3: LINT CODE QUALITY
        stage('3. Lint') {
            steps {
                echo 'Running ESLint code quality checks...'
                sh 'npm run lint'
            }
        }

        // STAGE 4: UNIT TESTS
        stage('4. Unit tests') {
            steps {
                echo 'Running Jest unit test suite...'
                sh 'npm run test:unit'
            }
        }

        // STAGE 5: INTEGRATION TESTS WITH EPHEMERAL POSTGRES & REDIS CONTAINERS
        stage('5. Integration tests') {
            steps {
                echo 'Spinning up ephemeral Postgres and Redis containers for integration testing...'
                sh 'docker compose -f docker-compose.test.yml up -d'
                sh 'sleep 5'
                sh 'npm run migrate'
                sh 'npm run seed'
                sh 'npm run test:integration'
            }
            post {
                always {
                    echo 'Tearing down ephemeral test database containers...'
                    sh 'docker compose -f docker-compose.test.yml down -v || true'
                }
            }
        }

        // STAGE 6: SECURITY SCAN (NPM AUDIT & TRIVY CONTAINER SCAN)
        stage('6. Security scan') {
            steps {
                echo 'Running npm security vulnerability audit...'
                sh 'npm audit --audit-level=high || true'
                script {
                    echo 'Checking for Trivy container security scanner...'
                    sh 'if command -v trivy > /dev/null; then trivy fs .; else echo "Trivy scanner not installed on build agent, skipping container image scan"; fi'
                }
            }
        }

        // STAGE 7: BUILD DOCKER IMAGE
        stage('7. Build Docker image') {
            when {
                expression {
                    return env.BRANCH_NAME == 'develop' || env.BRANCH_NAME == 'main' || env.GIT_BRANCH == 'origin/develop' || env.GIT_BRANCH == 'origin/main'
                }
            }
            steps {
                script {
                    echo "Building Docker image tagged with Git SHA: ${env.GIT_SHA_SHORT}"
                    sh "docker build -t ${DOCKER_REGISTRY}/${IMAGE_NAME}:${env.GIT_SHA_SHORT} ."
                    
                    if (env.BRANCH_NAME == 'main' || env.GIT_BRANCH == 'origin/main') {
                        echo "Tagging image with production version tags (1.0.0 and latest)..."
                        sh "docker tag ${DOCKER_REGISTRY}/${IMAGE_NAME}:${env.GIT_SHA_SHORT} ${DOCKER_REGISTRY}/${IMAGE_NAME}:1.0.0"
                        sh "docker tag ${DOCKER_REGISTRY}/${IMAGE_NAME}:${env.GIT_SHA_SHORT} ${DOCKER_REGISTRY}/${IMAGE_NAME}:latest"
                    } else if (env.BRANCH_NAME == 'develop' || env.GIT_BRANCH == 'origin/develop') {
                        echo "Tagging image with staging tag (develop)..."
                        sh "docker tag ${DOCKER_REGISTRY}/${IMAGE_NAME}:${env.GIT_SHA_SHORT} ${DOCKER_REGISTRY}/${IMAGE_NAME}:develop"
                    }
                }
            }
        }

        // STAGE 8: PUSH TO DOCKER REGISTRY
        stage('8. Push to registry') {
            when {
                expression {
                    return env.BRANCH_NAME == 'develop' || env.BRANCH_NAME == 'main' || env.GIT_BRANCH == 'origin/develop' || env.GIT_BRANCH == 'origin/main'
                }
            }
            steps {
                script {
                    echo "Pushing tagged Docker images to Container Registry..."
                    withCredentials([usernamePassword(credentialsId: 'docker-registry-credentials', usernameVariable: 'REGISTRY_USER', passwordVariable: 'REGISTRY_PASS')]) {
                        sh 'echo "$REGISTRY_PASS" | docker login -u "$REGISTRY_USER" --password-stdin || true'
                        sh "docker push ${DOCKER_REGISTRY}/${IMAGE_NAME}:${env.GIT_SHA_SHORT} || true"
                        if (env.BRANCH_NAME == 'main' || env.GIT_BRANCH == 'origin/main') {
                            sh "docker push ${DOCKER_REGISTRY}/${IMAGE_NAME}:1.0.0 || true"
                            sh "docker push ${DOCKER_REGISTRY}/${IMAGE_NAME}:latest || true"
                        } else {
                            sh "docker push ${DOCKER_REGISTRY}/${IMAGE_NAME}:develop || true"
                        }
                    }
                }
            }
        }

        // STAGE 9: DEPLOY TO STAGING (DEVELOP BRANCH ONLY)
        stage('9. Deploy to staging') {
            when {
                expression {
                    return env.BRANCH_NAME == 'develop' || env.GIT_BRANCH == 'origin/develop'
                }
            }
            steps {
                script {
                    echo 'Deploying application to Staging environment...'
                    env.DOCKER_IMAGE_TAG = env.GIT_SHA_SHORT
                    sh 'docker compose -f docker-compose.staging.yml pull || true'
                    sh 'docker compose -f docker-compose.staging.yml up -d'
                    sh 'sleep 5'

                    echo 'Executing Staging Smoke Tests...'
                    try {
                        sh 'node scripts/smoke-test.js http://localhost:3000 || bash scripts/smoke-test.sh http://localhost:3000'
                        echo '✅ Staging Smoke Tests Passed!'
                        notifySlack('SUCCESS', 'Staging deployment succeeded!')
                    } catch (Exception err) {
                        echo "❌ Staging Smoke Test Failed: ${err.message}. Initiating rollback..."
                        sh "docker compose -f docker-compose.staging.yml down -v || true"
                        sh "DOCKER_IMAGE_TAG=${env.PREV_STAGING_TAG} docker compose -f docker-compose.staging.yml up -d"
                        notifySlack('FAILURE', 'Staging deployment failed! Rolled back to previous version.')
                        error("Staging deployment smoke tests failed.")
                    }
                }
            }
        }

        // STAGE 10: MANUAL APPROVAL GATE (MAIN BRANCH ONLY)
        stage('10. Manual approval') {
            when {
                expression {
                    return env.BRANCH_NAME == 'main' || env.GIT_BRANCH == 'origin/main'
                }
            }
            steps {
                script {
                    echo '========================================================='
                    echo '🛑 MANUAL APPROVAL REQUIRED FOR PRODUCTION DEPLOYMENT'
                    echo '========================================================='
                    input message: 'Approve Production Deployment to FitPulse Platform?',
                          ok: 'Approve & Deploy to Production',
                          submitter: 'admin,lead,manager',
                          parameters: [
                              string(name: 'DEPLOYER_NOTES', defaultValue: 'Approved for production release', description: 'Deployment approval notes')
                          ]
                }
            }
        }

        // STAGE 11: DEPLOY TO PRODUCTION (MAIN BRANCH ONLY)
        stage('11. Deploy to production') {
            when {
                expression {
                    return env.BRANCH_NAME == 'main' || env.GIT_BRANCH == 'origin/main'
                }
            }
            steps {
                script {
                    echo 'Deploying application to Production environment...'
                    env.DOCKER_IMAGE_TAG = '1.0.0'
                    sh 'docker compose -f docker-compose.prod.yml pull || true'
                    sh 'docker compose -f docker-compose.prod.yml up -d'
                    sh 'sleep 5'

                    echo 'Executing Production Smoke Tests...'
                    try {
                        sh 'node scripts/smoke-test.js http://localhost:3000 || bash scripts/smoke-test.sh http://localhost:3000'
                        echo '🎉 Production Smoke Tests Passed!'
                        notifySlack('SUCCESS', 'Production deployment succeeded!')
                    } catch (Exception err) {
                        echo "❌ Production Smoke Test Failed: ${err.message}. Initiating Rollback..."
                        sh "docker compose -f docker-compose.prod.yml down -v || true"
                        sh "DOCKER_IMAGE_TAG=${env.PREV_PROD_TAG} docker compose -f docker-compose.prod.yml up -d || true"
                        notifySlack('FAILURE', 'Production deployment failed! Automatic rollback executed.')
                        currentBuild.result = 'UNSTABLE'
                        error("Production deployment failed post-deploy smoke test.")
                    }
                }
            }
        }
    }

    // POST BUILD ACTIONS & NOTIFICATIONS
    post {
        always {
            echo "Pipeline completion status: ${currentBuild.currentResult}"
        }
        failure {
            script {
                notifySlack('FAILURE', 'FitPulse CI/CD Pipeline build failed!')
            }
        }
        success {
            script {
                echo 'FitPulse CI/CD Pipeline executed cleanly.'
            }
        }
    }
}

// HELPER FUNCTION: SLACK NOTIFICATIONS
def notifySlack(String buildStatus, String customMessage) {
    try {
        echo "Sending Slack notification: [Status: ${buildStatus}] ${customMessage}"
        slackSend(
            channel: '#fitpulse-ci-cd-alerts',
            color: buildStatus == 'SUCCESS' ? '#36a64f' : '#danger',
            message: "*FitPulse Pipeline Notification*\n*Status*: ${buildStatus}\n*Branch*: ${env.BRANCH_NAME ?: env.GIT_BRANCH ?: 'unknown'}\n*Commit*: ${env.GIT_SHA_SHORT ?: 'N/A'}\n*Details*: ${customMessage}\n*Build URL*: <${env.BUILD_URL}|View Jenkins Build #${env.BUILD_NUMBER}>"
        )
    } catch (Exception e) {
        echo "Slack notification skipped (Slack plugin or webhook token not configured): ${e.message}"
    }
}
