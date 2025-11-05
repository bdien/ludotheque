interface BGGScoreProps {
  bggid: number;
  score: number;
}

export function BGGScore(props: BGGScoreProps) {
  return (
    <a href={`https://boardgamegeek.com/boardgame/${props.bggid}`}>
      <svg
        role="img"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        id="Boardgamegeek--Streamline-Simple-Icons"
        height="60"
        width="60"
      >
        <path
          d="m19.7 4.44 -2.38 0.64L19.65 0 4.53 5.56l0.83 6.67 -1.4 1.34L8.12 24l8.85 -3.26 3.07 -7.22 -1.32 -1.27 0.98 -7.81Z"
          fill="#FF5100"
          stroke-width="1"
        ></path>
        <text x={6} y={16} className="small" fill="#fff" fontSize="9px">
          {props.score.toFixed(1)}
        </text>
      </svg>
    </a>
  );
}
