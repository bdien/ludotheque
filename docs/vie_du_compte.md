# Vie du Compte

Un compte est actif quand son adhésion est effective (La durée d'une adhésion est de 1 an à partir du jour de paiement de l'adhésion).

Note: Les durées indiquées peuvent être modifiées dans le fichier `config.py`

La durée d'un prêt est de 3 semaines et il peut-etre étendu une fois par l'équipe de la ludothèque pour 2 semaines. Si la fin d'un prêt (prolongé ou pas) tombe pendant une période de fermeture de la ludothèque, la date de fin est décalée à l'ouverture suivante (sauf pendant l'été).

Quand un prêt est trop en retard (environ 2 semaines), un email automatique est envoyé à l'adhérent (Le jeudi à 19h). Pour éviter d'envoyer trop d'email à la même personne, une période de pause de 3 semaines entre les emails est prévue. Lors de vacances ou de jour férié, aucun email n'est envoyé.

**TODO** Pour un meilleur respect de la vie privée, l'historique d'emprunt sera limité au 3 dernières années, tout historique plus ancien sera supprimé ou anonymisé.

## Durée d'inactivité

**Note**: Pas encore implémenté !

Quand la date de fin de la dernière adhésion est dépassée de 2 ans, un email est envoyé à l'adhérent pour le prévenir que son compte va être désactivé, son solde restant éventuel est indiqué dans cet email. Dans cet email, nous indiquons que, sans réponse de leur part, leur compte (ainsi que l'historique et le solde) seront supprimés de nos serveurs.

A l'issu de cet email, le compte est désactivé et nécessite une opération manuelle pour le réactiver.

Après une période à définir, si le compte est toujours désactivé, sa suppression deviendra effective.
