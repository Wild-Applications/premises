docker build -t wildapps/premises:0.0.1 . &&
kubectl scale --replicas=0 deployment deployment --namespace=premises &&
kubectl scale --replicas=2 deployment deployment --namespace=premises
